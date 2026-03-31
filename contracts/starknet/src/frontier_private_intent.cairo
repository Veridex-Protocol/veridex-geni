#[starknet::interface]
trait IFrontierPrivateIntent<TState> {
    fn commit_intent(ref self: TState, mission_id: felt252, commitment: felt252, reveal_window_hours: u32);
    fn reveal_intent(ref self: TState, mission_id: felt252, reveal_hash: felt252);
    fn get_commitment(self: @TState, mission_id: felt252) -> felt252;
}

#[starknet::contract]
mod FrontierPrivateIntent {
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        commitments: Map<felt252, felt252>,
        reveals: Map<felt252, felt252>,
        reveal_windows: Map<felt252, u32>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        IntentCommitted: IntentCommitted,
        IntentRevealed: IntentRevealed,
    }

    #[derive(Drop, starknet::Event)]
    struct IntentCommitted {
        mission_id: felt252,
        commitment: felt252,
        reveal_window_hours: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct IntentRevealed {
        mission_id: felt252,
        reveal_hash: felt252,
    }

    #[abi(embed_v0)]
    impl FrontierPrivateIntentImpl of super::IFrontierPrivateIntent<ContractState> {
        fn commit_intent(ref self: ContractState, mission_id: felt252, commitment: felt252, reveal_window_hours: u32) {
            self.commitments.write(mission_id, commitment);
            self.reveal_windows.write(mission_id, reveal_window_hours);
            self.emit(Event::IntentCommitted(IntentCommitted { mission_id, commitment, reveal_window_hours }));
        }

        fn reveal_intent(ref self: ContractState, mission_id: felt252, reveal_hash: felt252) {
            self.reveals.write(mission_id, reveal_hash);
            self.emit(Event::IntentRevealed(IntentRevealed { mission_id, reveal_hash }));
        }

        fn get_commitment(self: @ContractState, mission_id: felt252) -> felt252 {
            self.commitments.read(mission_id)
        }
    }
}
