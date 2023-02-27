import {AllEntity, PackedEntity, ReceivedPackedEntity} from "../generated/schema";
import {Packet, PacketReceived} from "../generated/LayerzeroReceiver/Layerzero";
import {BigInt, ethereum} from "@graphprotocol/graph-ts";


export function handlePacket(event: Packet): void {
    let id = event.transaction.hash.toHex()
    let entity = new PackedEntity(id)
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.save()
    let all = load(event)
    all.packedCount =  all.packedCount.plus(BigInt.fromString("1"))
    all.save()
}

function load(event:ethereum.Event): AllEntity {
    let entity = AllEntity.load("1");
    if (entity == null) {
        entity = new AllEntity("1");
        entity.block = event.block.number
        entity.timestamp = event.block.timestamp
        entity.ReceivedPackedCount = BigInt.fromString("0")
        entity.packedCount = BigInt.fromString("0")
        entity.timestamp = event.block.timestamp
        entity.save()
        entity = AllEntity.load("1");
    }else {
        entity.block = event.block.number
        entity.timestamp = event.block.timestamp
    }
    return entity as AllEntity
}

export function handlePacketReceived(event: PacketReceived): void {
    let id = event.transaction.hash.toHex()
    let entity = new ReceivedPackedEntity(id)
    entity.block = event.block.number
    entity.timestamp = event.block.timestamp
    entity.save()
    let all = load(event)
    all.ReceivedPackedCount =  all.ReceivedPackedCount.plus(BigInt.fromString("1"))
    all.save()
}
