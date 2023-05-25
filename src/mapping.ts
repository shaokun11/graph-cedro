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

let CORE_ADDRESS = Address.fromString('0x01a2AFD378253860B833d1Ca25131EA47b968325')
let serverContract = Server.bind(CORE_ADDRESS)
let rootChainId = "0x424e420000000000000000000000000000000000000000000000000000000000"
let previous_communicate_count = "269493"

function updateAPY(event: ethereum.Event, key: Bytes, action: string, isNative: boolean): void {
    if (action != "LIQUIDATE") {
        // update apy
        let k = event.transaction.hash.toHexString()
        let entity = new ReserveEntity(k)
        let res = serverContract.try_pools(key)
        if (!res.reverted) {
            entity.currentRatio = res.value.value1
            entity.interestRate = res.value.value0
            entity.action = action
            entity.key = key.toHexString()
            entity.timestamp = event.block.timestamp
            entity.block = event.block.number
            entity.save()
        }
    }
    // update summary info
    let BIGINT_ONE = BigInt.fromString('1')
    let summaryEntity = SummaryEntity.load("1");
    if (summaryEntity == null) {
        summaryEntity = new SummaryEntity("1");
        summaryEntity.timestamp = event.block.timestamp
        summaryEntity.block = event.block.number
        summaryEntity.depositCount = BigInt.fromString("0")
        summaryEntity.withdrawCount = BigInt.fromString("0")
        summaryEntity.nonCrossCount = BigInt.fromString("0")
        summaryEntity.repayCount = BigInt.fromString("0")
        summaryEntity.borrowCount = BigInt.fromString("0")
        summaryEntity.totalCount = BigInt.fromString(previous_communicate_count)
        summaryEntity.liquidateCount = BigInt.fromString("0")
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
        if (isNative) {
            summaryEntity.nonCrossCount = summaryEntity.nonCrossCount.plus(BIGINT_ONE)
        }
        summaryEntity.totalCount = summaryEntity.totalCount.plus(BIGINT_ONE)
        summaryEntity.block = event.block.number
        summaryEntity.timestamp = event.block.timestamp
        summaryEntity.save()
    }
}

export function handleLiquidate(event: Liquidate): void {
    let entity = new LiquidateEntity(event.transaction.hash.toHexString())
    entity.user = event.params.user.toHexString()
    entity.liquidator = event.params.liquidator.toHexString()
    entity.collateralAmount = event.params.collateralAmount
    entity.debtId = event.params.debtId.toHexString()
    entity.collateralId = event.params.collateralId.toHexString()
    entity.burnDebtAmount = event.params.burnDebtAmount
    entity.repayAmount = event.params.repayAmount
    entity.discount = event.params.discount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.save()
    updateAPY(event, event.params.collateralId, 'LIQUIDATE', entity.debtId == entity.collateralId)
    let userAction = new UserActionEntity(event.transaction.hash.toHexString())
    userAction.action = "LIQUIDATE"
    userAction.user = event.params.user.toHexString()
    userAction.liquidator = event.params.liquidator.toHexString()
    userAction.collateralAmount = event.params.collateralAmount
    userAction.debtId = event.params.debtId.toHexString()
    userAction.collateralId = event.params.collateralId.toHexString()
    userAction.burnDebtAmount = event.params.burnDebtAmount
    userAction.repayAmount = event.params.repayAmount
    userAction.block = event.block.number
    userAction.timestamp = event.block.timestamp
    userAction.save()

}

export function handleBorrow(event: Borrow): void {
    let id = event.transaction.hash.toHexString()
    let entity = new BorrowEntity(id)
    entity.debtAmount = event.params.debtAmount
    entity.tokenAmount = event.params.tokenAmount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.chainId = event.params.chainId.toHexString()
    entity.key = event.params.id.toHexString()
    entity.to = event.params.to.toHexString()
    entity.user = event.params.user.toHexString()
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
    updateAPY(event, event.params.id, 'BORROW', entity.chainId == rootChainId)

    let userAction = new UserActionEntity(id)
    userAction.action = "BORROW"
    userAction.debtAmount = event.params.debtAmount
    userAction.tokenAmount = event.params.tokenAmount
    userAction.block = event.block.number
    userAction.to = event.params.to.toHexString()
    userAction.timestamp = event.block.timestamp
    userAction.chainId = event.params.chainId.toHexString()
    userAction.key = event.params.id.toHexString()
    userAction.user = event.params.user.toHexString()
    userAction.save()
}

export function handleDeposit(event: Deposit): void {
    let id = event.transaction.hash.toHexString()
    let entity = new DepositEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    entity.chainId = event.params.chainId.toHexString()
    entity.key = event.params.id.toHexString()
    entity.user = event.params.user.toHexString()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "DEPOSIT", entity.chainId == rootChainId)

    let userAction = new UserActionEntity(id)
    userAction.action = "DEPOSIT"
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    userAction.chainId = event.params.chainId.toHexString()
    userAction.key = event.params.id.toHexString()
    userAction.user = event.params.user.toHexString()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()

}

export function handleWithdraw(event: Withdraw): void {
    let id = event.transaction.hash.toHexString()
    let entity = new WithdrawEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    entity.chainId = event.params.chainId.toHexString()
    entity.key = event.params.id.toHexString()
    entity.user = event.params.user.toHexString()
    entity.to = event.params.to.toHexString()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "WITHDRAW", entity.chainId == rootChainId)

    let userAction = new UserActionEntity(id)
    userAction.action = "WITHDRAW"
    userAction.to = event.params.to.toHexString()
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    userAction.chainId = event.params.chainId.toHexString()
    userAction.key = event.params.id.toHexString()
    userAction.user = event.params.user.toHexString()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()
}

export function handleRepay(event: Repay): void {
    let id = event.transaction.hash.toHexString()
    let entity = new RepayEntity(id)
    entity.tokenAmount = event.params.tokenAmount
    entity.ceAmount = event.params.ceAmount
    entity.debtAmount = event.params.debtAmount
    entity.chainId = event.params.chainId.toHexString()
    entity.key = event.params.id.toHexString()
    entity.user = event.params.user.toHexString()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateAPY(event, event.params.id, "REPAY", entity.chainId == rootChainId)
    let userAction = new UserActionEntity(id)
    userAction.action = "REPAY"
    userAction.tokenAmount = event.params.tokenAmount
    userAction.ceAmount = event.params.ceAmount
    userAction.debtAmount = event.params.debtAmount
    userAction.chainId = event.params.chainId.toHexString()
    userAction.key = event.params.id.toHexString()
    userAction.user = event.params.user.toHexString()
    userAction.timestamp = event.block.timestamp
    userAction.block = event.block.number
    userAction.save()
}
