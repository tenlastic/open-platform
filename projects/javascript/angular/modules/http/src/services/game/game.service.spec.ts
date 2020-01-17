import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Game } from '../../models/game';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { GameService } from './game.service';

describe('GameService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        GameService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(GameService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Game', () => {
      const params = {
        title: chance.hash(),
      };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(Game));
        expect(res._id).toBeDefined();
        expect(res.title).toEqual(params.title);
      });

      const req = httpMock.expectOne(service.basePath);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          title: params.title,
        },
      });
    });
  });

  describe('delete()', () => {
    it('deletes the user and returns true', () => {
      const slug = chance.hash();

      service.delete(slug).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${slug}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Games', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Game));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === service.basePath);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a Game', () => {
      const _id = chance.hash();
      const slug = chance.hash();

      service.findOne(slug).then(res => {
        expect(res).toEqual(jasmine.any(Game));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(`${service.basePath}/${slug}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });

  describe('update()', () => {
    it('updates and returns a Game', () => {
      const params = {
        _id: chance.hash(),
        slug: chance.hash(),
        title: chance.hash(),
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(Game));
        expect(res._id).toEqual(params._id);
        expect(res.slug).toEqual(params.slug);
        expect(res.title).toEqual(params.title);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params.slug}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
