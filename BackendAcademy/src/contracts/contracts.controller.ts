import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import {
  DeployContractDto,
  InvokeContractDto,
} from './dto/invoke-contract.dto';
import {
  CreateProposalDto,
  CastVoteDto,
} from './dto/governance.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('invoke')
  async invokeContract(@Body() dto: InvokeContractDto) {
    return this.contractsService.invokeContract(dto);
  }

  @Post('deploy')
  async deployContract(@Body() dto: DeployContractDto) {
    return this.contractsService.deployContract(dto);
  }

  @Get(':contractId')
  async getContractInfo(@Param('contractId') contractId: string) {
    return this.contractsService.getContractInfo(contractId);
  }

  @Get(':contractId/health')
  async getContractHealth(@Param('contractId') contractId: string) {
    return this.contractsService.getContractHealth(contractId);
  }

  @Get(':contractId/history')
  async getInvocationHistory(@Param('contractId') contractId: string) {
    return this.contractsService.getInvocationHistory(contractId);
  }

  @Get()
  async getAllDeployments() {
    return this.contractsService.getAllDeployments();
  }

  @Post('governance/proposals')
  createProposal(@Body() dto: CreateProposalDto) {
    return this.contractsService.createProposal(
      dto.title,
      dto.description,
      dto.proposer,
    );
  }

  @Get('governance/proposals')
  listProposals() {
    return this.contractsService.listProposals();
  }

  @Get('governance/proposals/:id')
  getProposal(@Param('id') id: string) {
    return this.contractsService.getProposal(id);
  }

  @Post('governance/proposals/:id/vote')
  castVote(@Param('id') id: string, @Body() dto: CastVoteDto) {
    return this.contractsService.castVote(id, dto.userId, dto.vote);
  }
}