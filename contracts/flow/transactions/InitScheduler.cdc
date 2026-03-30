import FrontierMissionScheduler from 0xFrontier

transaction {
  prepare(signer: auth(BorrowValue) &Account) {
    log("FrontierMissionScheduler already deployed. Use this transaction to initialize account storage if needed.")
  }
}
