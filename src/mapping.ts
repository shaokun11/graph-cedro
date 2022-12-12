import {Borrow, Deposit, Liquidate, Repay, Server, Withdraw} from "../generated/Server/Server";
import {
    BorrowEntity,
    BorrowUsersEntity,
    DepositEntity,
    LiquidateEntity,
    RepayEntity,
    ReserveEntity,
    SummaryEntity,
    UserActionEntity,
    WithdrawEntity
} from "../generated/schema";
import {Address, BigInt, Bytes, ethereum} from "@graphprotocol/graph-ts";


let serverAddress = Address.fromString('0x8bAF49C4b98b7D2e0B7F870ab6533dED69070614')
let serverContract = Server.bind(serverAddress)

function updateAPY(event: ethereum.Event, key: Bytes, action: string): void {
    if (action != "LIQUIDATE") {
        // update apy
        let k = event.transaction.hash.toHex()
        let entity = new ReserveEntity(k)
        let res = serverContract.reserves(key)
        entity.currentRatio = res.getCurrentRatio()
        entity.interestRate = res.getInterestRate()
        entity.action = action
        entity.key = key.toHex()
        entity.timestamp = event.block.timestamp
        entity.block = event.block.number
        entity.save()
    }
    // update summary info
    let BIGINT_ONE = BigInt.fromString('1')
    let summaryEntity = SummaryEntity.load("1");
    if (summaryEntity == null) {
        summaryEntity = new SummaryEntity("1");
        summaryEntity.timestamp = event.block.timestamp
        summaryEntity.block = event.block.number
        summaryEntity.depositCount = BigInt.zero()
        summaryEntity.withdrawCount = BigInt.zero()
        summaryEntity.repayCount = BigInt.zero()
        summaryEntity.borrowCount = BigInt.zero()
        summaryEntity.totalCount = BigInt.zero()
        summaryEntity.liquidateCount = BigInt.zero()
        summaryEntity.save()
        summaryEntity = SummaryEntity.load("1");
    }
    if (summaryEntity != null) {
        if (action == "DEPOSIT") {
            summaryEntity.depositCount = summaryEntity.depositCount.plus(BIGINT_ONE)
        } else if (action == "BORROW") {
            summaryEntity.borrowCount = summaryEntity.borrowCount.plus(BIGINT_ONE)
        } else if (action == "WITHDRAW") {
            summaryEntity.withdrawCount = summaryEntity.withdrawCount.plus(BIGINT_ONE)
        } else if (action == "REPAY") {
            summaryEntity.repayCount = summaryEntity.repayCount.plus(BIGINT_ONE)
        } else if (action == "LIQUIDATE") {
            summaryEntity.liquidateCount = summaryEntity.liquidateCount.plus(BIGINT_ONE)
        }
        summaryEntity.totalCount = summaryEntity.totalCount.plus(BIGINT_ONE)
        summaryEntity.block = event.block.number
        summaryEntity.timestamp = event.block.timestamp
        summaryEntity.save()
    }
}

export function handleLiquidate(event: Liquidate): void {
    let entity = new LiquidateEntity(event.transaction.hash.toHex())
    entity.user = event.params.user.toHex()
    entity.liquidator = event.params.liquidator.toHex()
    entity.ceCollateralAmount = event.params.ceCollateralAmount
    entity.debtId = event.params.debtId.toHex()
    entity.collateralId = event.params.collateralId.toHex()
    entity.debtAmount = event.params.debtAmount
    entity.ceDebtAmount = event.params.ceDebtAmount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.save()
    updateAPY(event, event.params.collateralId, 'LIQUIDATE')
    let userAction = new UserActionEntity(event.transaction.hash.toHex())
    userAction.action = "LIQUIDATE"
    userAction.user = event.params.user.toHex()
    userAction.liquidator = event.params.liquidator.toHex()
    userAction.ceCollateralAmount = event.params.ceCollateralAmount
    userAction.debtId = event.params.debtId.toHex()
    userAction.collateralId = event.params.collateralId.toHex()
    userAction.debtAmount = event.params.debtAmount
    userAction.ceDebtAmount = event.params.ceDebtAmount
    userAction.block = event.block.number
    userAction.timestamp = event.block.timestamp
    userAction.save()

}

export function handleBorrow(event: Borrow): void {
    let id = event.transaction.hash.toHex()
    let entity = new BorrowEntity(id)
    entity.debtAmount = event.params.debtAmount
    entity.tokenAmount = event.params.tokenAmount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.key = event.params.id.toHex()
    entity.user = event.params.user.toHex()
    entity.save()

    let usersEntity = BorrowUsersEntity.load("1");
    if (usersEntity == null) {
        usersEntity = new BorrowUsersEntity("1");
        usersEntity.users = []
        usersEntity.timestamp = entity.timestamp
        usersEntity.save()
        usersEntity = BorrowUsersEntity.load("1");
    }
    if (usersEntity != null) {
        let users = usersEntity.users
        if (!users.includes(entity.user)) {
            users.push(entity.user)
            usersEntity.users = users
        }
        usersEntity.timestamp = entity.timestamp
        usersEntity.save()
    }
    updateAPY(event, event.params.id, 'BORROW')

    let userAction = new UserActionEntity(id)
    userAction.action = "BORROW"
    userAction.debtAmount = event.params.debtAmount
    userAction.tokenAmount = event.params.tokenAmount
    userAction.block = event.block.number
    userAction.timestamp = event.block.timestamp
    // @ts-ignore
    userAction.chainId = BigInt.fromI32(event.params.chainId as i32)
    userAction.key = event.params.id.toHex()
    userAction.user = event.params.user.toHex()
    userAction.save()
}

export function handleDeposit(event: Deposit): void {
    let id = event.transaction.hash.toHex()
    let entity = new DepositEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.key = event.params.id.toHex()
    entity.user = event.params.user.toHex()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "DEPOSIT")

    let userAction = new UserActionEntity(id)
    userAction.action = "DEPOSIT"
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    // @ts-ignore
    userAction.chainId = BigInt.fromI32(event.params.chainId as i32)
    userAction.key = event.params.id.toHex()
    userAction.user = event.params.user.toHex()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()

}

export function handleWithdraw(event: Withdraw): void {
    let id = event.transaction.hash.toHex()
    let entity = new WithdrawEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.key = event.params.id.toHex()
    entity.user = event.params.user.toHex()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "WITHDRAW")

    let userAction = new UserActionEntity(id)
    userAction.action = "WITHDRAW"
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    // @ts-ignore
    userAction.chainId = BigInt.fromI32(event.params.chainId as i32)
    userAction.key = event.params.id.toHex()
    userAction.user = event.params.user.toHex()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()
}

export function handleRepay(event: Repay): void {
    let id = event.transaction.hash.toHex()
    let entity = new RepayEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    entity.debtAmount = event.params.debtAmount
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.key = event.params.id.toHex()
    entity.user = event.params.user.toHex()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "REPAY")
    let userAction = new UserActionEntity(id)
    userAction.action = "REPAY"
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    userAction.debtAmount = event.params.debtAmount
    // @ts-ignore
    userAction.chainId = BigInt.fromI32(event.params.chainId as i32)
    userAction.key = event.params.id.toHex()
    userAction.user = event.params.user.toHex()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()
}
