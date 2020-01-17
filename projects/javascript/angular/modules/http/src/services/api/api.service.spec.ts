import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ApiService } from './api.service';

describe('ApiService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('request()', () => {
    describe('GET and DELETE requests', () => {
      it('converts the parameters to a query string', () => {
        const _id = chance.hash();

        const method = 'get';
        const parameters = {
          where: { _id },
        };
        const url = 'http://localhost:3000/users';

        service.request(method, url, parameters).then(res => {
          expect(res.length).toBe(1);
          expect(res[0]._id).toBe(_id);
        });

        const req = httpMock.expectOne(r => r.url === url);
        expect(req.request.method).toBe('GET');
        req.flush([{ _id }]);
      });
    });

    describe('POST and PUT requests', () => {
      it('passes the parameters as the body', () => {
        const _id = chance.hash();

        const method = 'post';
        const parameters = { _id };
        const url = 'http://localhost:3000/users';

        service.request(method, url, parameters).then(res => {
          expect(res._id).toBe(_id);
        });

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(parameters);
        req.flush({ _id });
      });
    });
  });
});
