import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WebSocket } from '../../models/web-socket';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { WebSocketService } from './web-socket.service';

describe('WebSocketService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        WebSocketService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(WebSocketService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('find()', () => {
    it('returns an array of WebSockets', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(WebSocket));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a WebSocket', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(WebSocket));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });
});
