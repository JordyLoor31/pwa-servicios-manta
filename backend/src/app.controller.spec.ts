import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(new AppController(new AppService()).getHello()).toBe('Hello World!');
    });
  });
});
