import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateChatRequestDto } from './dto/create-chat-request.dto';
import { GetHintDto } from './dto/get-hint.dto';
import { PreScoreDto } from './dto/pre-score.dto';
import { ChatMessage } from './interfaces/ai.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async sendChatMessage(@Body() createChatRequestDto: CreateChatRequestDto) {
    return this.aiService.processChatRequest(createChatRequestDto);
  }

  @Post('hint')
  async getHint(@Body() getHintDto: GetHintDto) {
    return this.aiService.getHint(getHintDto);
  }

  @Post('pre-score')
  async preScore(@Body() dto: PreScoreDto) {
    return this.aiService.preScore(dto);
  }

  @Get('history/:userId')
  async getChatHistory(
    @Param('userId') userId: string,
  ): Promise<ChatMessage[]> {
    return this.aiService.getChatHistory(userId);
  }
}
