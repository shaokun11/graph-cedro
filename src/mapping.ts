import {Borrow, Deposit, Server, Withdraw} from "../generated/Server/Server";
import {
    BorrowEntity,
    BorrowUsersEntity,
    ClientEntity,
    DepositEntity,
    UserEntity,
    WithdrawEntity
} from "../generated/schema";
import {Address, BigInt} from "@graphprotocol/graph-ts";

let serverContract = Server.bind(Address.fromString("0x129F1409197d00f484ea9924233D6b96e0458159"))


function updateViewContract(clientId: BigInt, user: string): void {
    let res = serverContract.clients(BigInt.fromString("1"));
    let entity = ClientEntity.load("1");
    if (entity == null) {
        entity = new ClientEntity("1");
    }
    entity.liquidityA = res.value0.liquidity
    entity.liquidityB = res.value1.liquidity;
    entity.totalShareA = res.value0.totalShare;
    entity.totalShareB = res.value1.totalShare;
    entity.save()
    let id = user.concat("/").concat(clientId.toString())
    let entityUser = UserEntity.load(id);
    if (entityUser == null) {
        entityUser = new UserEntity(id);
    }
    entityUser.clientId = clientId;
    entityUser.user = user;
    let resUser = serverContract.userInfos(Address.fromString(user), clientId);
    entityUser.shareA = resUser.value0
    entityUser.shareB = resUser.value1
    entityUser.save()

}

export function handleBorrow(event: Borrow): void {
    let id = event.transaction.hash.toHex()
    let entity = new BorrowEntity(id)
    entity.amount = event.params.amount
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    // @ts-ignore
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
    updateViewContract(event.params.clientId, event.params.user.toHex())
}

export function handleRepay(event: Deposit): void {
    updateViewContract(event.params.clientId, event.params.user.toHex())
}

export function handleDeposit(event: Deposit): void {
    let id = event.transaction.hash.toHex()
    let entity = new DepositEntity(id)
    entity.amount = event.params.amount
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.clientId = event.params.clientId
    entity.user = event.params.user.toHex()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateViewContract(event.params.clientId, event.params.user.toHex())
}

export function handleWithdraw(event: Withdraw): void {
    let id = event.transaction.hash.toHex()
    let entity = new WithdrawEntity(id)
    entity.amount = event.params.amount
    entity.share = event.params.share
    // @ts-ignore
    entity.chainId = BigInt.fromI32(event.params.chainId as i32)
    entity.clientId = event.params.clientId
    entity.user = event.params.user.toHex()
    entity.timestamp = event.block.timestamp
    entity.block = event.block.number
    entity.save()
    updateViewContract(event.params.clientId, event.params.user.toHex())
}
