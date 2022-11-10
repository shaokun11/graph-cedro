import {Borrow, Deposit, Repay, Withdraw} from "../generated/Server/Server";
import {BorrowEntity, BorrowUsersEntity, DepositEntity, RepayEntity, WithdrawEntity} from "../generated/schema";
import {BigInt} from "@graphprotocol/graph-ts";

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
}
