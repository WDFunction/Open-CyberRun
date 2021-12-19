import { } from 'jest'
import { CyberRun, Game } from '@cyberrun/core'
import { ObjectId } from 'mongodb'

describe('test', () => {
  let cbr: CyberRun

  beforeAll(async () => {
    cbr = new CyberRun(true)
    await cbr.start()
  })

  afterAll(async () => {
    await cbr.stop()
  })

  describe('common test', () => {
    // 游戏流程测试
    // a -> b -> meta -> end
    //      c ↗
    let gameId: ObjectId
    let game: Game
    let userId: ObjectId
    let levels: Record<string, ObjectId> = {}
    beforeAll(async () => {
      let r = await cbr.game.adminNew()
      gameId = r.insertedId
      console.log(gameId)
      game = await cbr.game.col.findOne({_id: gameId})

      let temp = await cbr.level.adminAdd({ x: 100, y: 100, gameId })
      levels.a = temp
      temp = await cbr.level.adminAdd({ x: 100, y: 100, gameId })
      levels.b = temp
      temp = await cbr.level.adminAdd({ x: 100, y: 100, gameId })
      levels.c = temp
      temp = await cbr.level.adminAdd({ x: 100, y: 100, gameId })
      levels.meta = temp
      temp = await cbr.level.adminAdd({ x: 100, y: 100, gameId })
      levels.end = temp

      let user = await cbr.user.col.insertOne({
        email: "", email_verified: false, email_verify_token: '', createdAt: new Date(), username: '', password: ''
      })
      userId = user.insertedId
    })

    test('patch game', async () => {
      const date = new Date()
      let r = await cbr.game.adminUpdate(gameId, {
        startedAt: date.toISOString(), endedAt: date.toISOString(), map: "", cover: "", type: "meta", hidden: false
      })
      expect(r).toBeDefined()
    })

    test('list games', async () => {
      let list = await cbr.game.list()
      expect(list.map(v => v._id)).toContainEqual(gameId)
    })

    test('get game', async () => {
      expect(gameId).toBeDefined()
    })

    test('create maps', async () => {
      await cbr.level.adminAddMap({ gameId, fromLevelId: levels.a, toLevelId: levels.b })
      await cbr.level.adminAddMap({ gameId, fromLevelId: levels.b, toLevelId: levels.meta })
      await cbr.level.adminAddMap({ gameId, fromLevelId: levels.c, toLevelId: levels.meta })
      await cbr.level.adminAddMap({ gameId, fromLevelId: levels.meta, toLevelId: levels.end })
    })

    test('access levels', async () => {
      let result = await cbr.game.canAccessLevel(userId, levels.a)
      expect(result).toBeTruthy()
      result = await cbr.game.canAccessLevel(userId, levels.meta)
      expect(result).toBeFalsy()

      result = await cbr.game.isUserFinished(game, userId)
      expect(result).toBeFalsy()
    })

    test('submit', async () => {
      await expect(cbr.level.verifyAnswer(levels.a, ['wrong'], userId)).rejects.toThrow()

      let result = await cbr.level.verifyAnswer(levels.a, ['Example'], userId)
      expect(result[1]).not.toBeNull()

      await expect(cbr.game.countTries(gameId)).resolves.toBe(2)
      await expect(cbr.game.countLevelTries(levels.a)).resolves.toBe(2)
      await expect(cbr.game.countUserGameTries(gameId, userId)).resolves.toBe(2)
      await expect(cbr.game.countUserLevelTries(levels.a, userId)).resolves.toBe(2)
    })

    test('delete game', async () => {
      await cbr.game.adminDelete(gameId)
      let game = await cbr.game.get(gameId)
      expect(game).toBeUndefined()
    })
  })

  test('test', () => {
    expect(cbr).not.toBe(null)
  })
})