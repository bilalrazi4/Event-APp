import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';

describe('Event Collaboration API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/events/batch (POST) should insert events in bulk', async () => {
    // Create a test user
    const user = await dataSource.getRepository(User).save({
      name: 'Batch User',
      email: 'batch@example.com',
    });

    const events = Array.from({ length: 5 }).map((_, i) => ({
      title: `Event ${i}`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      organizerId: user.id,
    }));

    return request(app.getHttpServer())
      .post('/events/batch')
      .send(events)
      .expect(201)
      .expect((res) => {
        expect(res.body.count).toBe(5);
      });
  });

  it('/events/merge-all/:userId (POST) should merge overlapping events', async () => {
    const user = await dataSource.getRepository(User).save({
      name: 'Merge User',
      email: 'merge@example.com',
    });

    const now = new Date();
    const event1 = {
      title: 'Overlap 1',
      startTime: now.toISOString(),
      endTime: new Date(now.getTime() + 3600000).toISOString(),
      organizerId: user.id,
    };
    const event2 = {
      title: 'Overlap 2',
      startTime: new Date(now.getTime() + 1800000).toISOString(),
      endTime: new Date(now.getTime() + 5400000).toISOString(),
      organizerId: user.id,
    };

    // Pre-insert events
    await request(app.getHttpServer()).post('/events').send(event1);
    await request(app.getHttpServer()).post('/events').send(event2);

    return request(app.getHttpServer())
      .post(`/events/merge-all/${user.id}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toBe('Events merged successfully');
        expect(res.body.event.title).toContain('Overlap 1 + Overlap 2');
      });
  });
});
