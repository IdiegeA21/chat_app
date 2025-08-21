interface RateLimit {
  messages: number[];
  typing: number[];
}

class RateLimiter {
  private userLimits: Map<number, RateLimit> = new Map();
  private readonly MESSAGE_LIMIT = 5;
  private readonly MESSAGE_WINDOW = 10000; // 10 seconds
  private readonly TYPING_LIMIT = 3;
  private readonly TYPING_WINDOW = 1000; // 1 second

  private cleanOldEntries(timestamps: number[], window: number): number[] {
    const now = Date.now();
    return timestamps.filter(timestamp => now - timestamp < window);
  }

  checkMessageLimit(userId: number): boolean {
    const userLimit = this.userLimits.get(userId) || { messages: [], typing: [] };
    
    userLimit.messages = this.cleanOldEntries(userLimit.messages, this.MESSAGE_WINDOW);
    
    if (userLimit.messages.length >= this.MESSAGE_LIMIT) {
      return false;
    }
    
    userLimit.messages.push(Date.now());
    this.userLimits.set(userId, userLimit);
    return true;
  }

  checkTypingLimit(userId: number): boolean {
    const userLimit = this.userLimits.get(userId) || { messages: [], typing: [] };
    
    userLimit.typing = this.cleanOldEntries(userLimit.typing, this.TYPING_WINDOW);
    
    if (userLimit.typing.length >= this.TYPING_LIMIT) {
      return false;
    }
    
    userLimit.typing.push(Date.now());
    this.userLimits.set(userId, userLimit);
    return true;
  }

  clearUserLimits(userId: number): void {
    this.userLimits.delete(userId);
  }
}

export default new RateLimiter();
