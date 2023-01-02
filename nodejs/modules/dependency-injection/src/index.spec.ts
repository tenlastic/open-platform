import { expect } from 'chai';

import { get, inject, Injection } from './';

describe('index', function () {
  context('useFactory', function () {
    context('circular dependencies', function () {
      it('injects a dependency', function () {
        class A {
          public value = 'A';
          constructor(public b: B) {}
        }
        class B {
          public value = 'B';
          constructor(public a: A) {}
        }

        const injections: Injection[] = [
          { deps: [B], provide: A, useFactory: (b: B) => new A(b) },
          { deps: [A], provide: B, useFactory: (a: A) => new B(a) },
        ];

        expect(inject.bind(inject, injections)).to.throw();
      });
    });

    context('no circular dependencies', function () {
      it('injects a dependency', function () {
        class A {
          public value = 'A';
        }
        class B {
          public value = 'B';
          constructor(public a: A) {}
        }

        const injections: Injection[] = [
          { provide: A, useValue: new A() },
          { deps: [A], provide: B, useFactory: (a: A) => new B(a) },
        ];
        inject(injections);

        const b = get(B);
        expect(b.value).to.eql('B');
        expect(b.a.value).to.eql('A');
      });
    });
  });

  context('useValue', function () {
    it('injects a dependency', function () {
      class A {
        public value = 'A';
      }
      class B {
        public value = 'B';
      }

      const injections: Injection[] = [
        { provide: A, useValue: new A() },
        { provide: B, useValue: new B() },
      ];
      inject(injections);

      const a = get(A);
      expect(a.value).to.eql('A');
    });
  });
});
