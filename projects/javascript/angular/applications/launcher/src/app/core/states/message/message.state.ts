import { Injectable } from '@angular/core';
import { Message, MessageService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class MessageState {
  public messages: Message[] = [];

  constructor(private messageService: MessageService) {
    this.messageService.onCreate.subscribe(message => {
      this.messages.push(message);
    });

    this.messageService.onDelete.subscribe(message => {
      const index = this.messages.findIndex(m => m._id === message._id);
      this.messages.splice(index, 1);
    });

    this.messageService.onUpdate.subscribe(message => {
      const index = this.messages.findIndex(m => m._id === message._id);
      this.messages[index] = message;
    });
  }

  public getUnreadMessages(toUserId: string, fromUserId?: string) {
    if (fromUserId) {
      return this.messages.filter(
        m => m.fromUserId === fromUserId && !m.readAt && m.toUserId === toUserId,
      );
    } else {
      return this.messages.filter(m => !m.readAt && m.toUserId === toUserId);
    }
  }
}
