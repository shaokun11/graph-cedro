import {Borrow, Deposit, Repay, Server, Withdraw} from "../generated/Server/Server";
import {
    BorrowEntity,
    BorrowUsersEntity,
    DepositEntity,
    RepayEntity,
    ReserveEntity,
    SummaryEntity,
    WithdrawEntity
} from "../generated/schema";
import {Address, BigInt, Bytes, ethereum} from "@graphprotocol/graph-ts";


let serverAddress = Address.fromString('0xd34e4372f5E99fb390bB91603d9AEa851cA46f5A')
let serverContract = Server.bind(serverAddress)

function updateAPY(event: ethereum.Event, key: Bytes, action: string): void {
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

    let summaryEntity = SummaryEntity.load("1");
    if (summaryEntity == null) {
        summaryEntity = new SummaryEntity("1");
        summaryEntity.timestamp = entity.timestamp
        summaryEntity.block = entity.block
        summaryEntity.depositCount = BigInt.zero()
        summaryEntity.withdrawCount = BigInt.zero()
        summaryEntity.repayCount = BigInt.zero()
        summaryEntity.borrowCount = BigInt.zero()
        summaryEntity.block = entity.block
        summaryEntity.timestamp = entity.timestamp
        summaryEntity.save()
        summaryEntity = SummaryEntity.load("1");
    }
    if (summaryEntity != null) {
        let BIGINT_ONE = BigInt.fromString('1')
        if (action == "DEPOSIT") {
            summaryEntity.depositCount = summaryEntity.depositCount.plus(BIGINT_ONE)
        } else if (action == "BORROW") {
            summaryEntity.borrowCount = summaryEntity.borrowCount.plus(BIGINT_ONE)
        } else if (action == "WITHDRAW") {
            summaryEntity.withdrawCount = summaryEntity.withdrawCount.plus(BIGINT_ONE)
        } else if (action == "REPAY") {
            summaryEntity.repayCount = summaryEntity.repayCount.plus(BIGINT_ONE)
        }
        summaryEntity.block = entity.block
        summaryEntity.timestamp = entity.timestamp
        summaryEntity.save()
    }
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
}
