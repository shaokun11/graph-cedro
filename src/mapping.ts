import {Borrow} from "../generated/Server/Server";
import {BorrowEntity, BorrowUsersEntity} from "../generated/schema";
import {BigInt} from "@graphprotocol/graph-ts";

export function handleBorrow(event: Borrow): void {
    let id = event.transaction.hash.toHex()
    let entity = new BorrowEntity(id)
    entity.amount = event.params.amount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.clientId = event.params.clientId
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

