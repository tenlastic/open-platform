import { Chance } from 'chance';

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Article } from '../../models/article';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: ArticleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        ArticleService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ArticleService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Article', () => {
      const params = { title: chance.hash() };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(Article));
        expect(res._id).toBeDefined();
        expect(res.title).toEqual(params.title);
      });

      const req = httpMock.expectOne(`${service.basePath}`);
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
      const _id = chance.hash();

      service.delete(_id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Articles', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Article));
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
    it('returns a Article', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(Article));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });

  describe('update()', () => {
    it('updates and returns a Article', () => {
      const params = {
        _id: chance.hash(),
        title: chance.hash(),
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(Article));
        expect(res._id).toEqual(params._id);
        expect(res.title).toEqual(params.title);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params._id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
