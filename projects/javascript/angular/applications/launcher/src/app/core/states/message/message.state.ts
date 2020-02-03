import { Injectable } from '@angular/core';
import { Message, MessageService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class MessageState {
  public messages: Message[] = [];
  public get unreadMessages() {
    return this.messages.filter(m => !m.readAt);
  }

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
}
