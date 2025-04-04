import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Chat } from '@entities/chat.entity';
import { User } from '@entities/user.entity';

@Injectable()
export class ChatService {

  constructor(private readonly dataSource: DataSource) {}

  public create(usersIds: string[]) {
    const chat = new Chat();

    chat.users = [];

    usersIds.forEach((userId) => {
      const user = new User();

      user.id = userId;

      chat.users.push(user);
    });

    return this.dataSource.getRepository(Chat).save(chat);
  }

}