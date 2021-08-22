export default class PointModule {
  core: CyberRun
  col: Collection<Game>
  logger = new Logger('point')
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Game>('game')
  }
}