import { Collection, ObjectId } from "mongodb";
import { CyberRun } from "../app";

export interface Level {
  _id: ObjectId
  gameId: ObjectId;
  title: string;
  content: string;
  type: "start" | "end" | "normal"
}

export interface LevelMap {
  _id: ObjectId;
  fromLevelId: ObjectId;
  toLevelId: ObjectId;
  answers: RegExp[];
}

export default class LevelModule {
  core: CyberRun
  levelCol: Collection<Level>
  mapCol: Collection<LevelMap>
  constructor(core: CyberRun) {
    this.core = core

    this.levelCol = core.db.collection<Level>('level')
    this.mapCol = core.db.collection<LevelMap>('levelMap')
  }
}