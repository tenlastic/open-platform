import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GameServerLog } from '../../models/game-server-log';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { GameServerLogService } from './game-server-log.service';

describe('GameServerLogService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: GameServerLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        GameServerLogService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(GameServerLogService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('count()', () => {
    it('returns a count', () => {
      const _id = chance.hash();
      const gameServerId = chance.hash();
      const params = {
        where: { _id },
      };

      service.count(gameServerId, params).then(res => {
        expect(res).toBe(1);
      });

      const req = httpMock.expectOne(
        r => r.url === `${service.basePath}/${gameServerId}/logs/count`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1 });
    });
  });

  describe('create()', () => {
    it('creates and returns a GameServerLog', () => {
      const gameServerId = chance.hash();
      const params = {
        gameServerId: chance.hash(),
        toUserId: chance.hash(),
      };

      service.create(gameServerId, params).then(res => {
        expect(res).toEqual(jasmine.any(GameServerLog));
        expect(res._id).toBeDefined();
        expect(res.gameServerId).toEqual(params.gameServerId);
      });

      const req = httpMock.expectOne(`${service.basePath}/${gameServerId}/logs`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          gameServerId: params.gameServerId,
          toUserId: params.toUserId,
        },
      });
    });
  });

  describe('find()', () => {
    it('returns an array of GameServerLogs', () => {
      const _id = chance.hash();
      const gameServerId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(gameServerId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(GameServerLog));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${gameServerId}/logs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
