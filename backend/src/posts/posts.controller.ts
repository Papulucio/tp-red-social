import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/multer.config.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryCommentsDto } from './dto/query-comments.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PostsService } from './posts.service.js';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen', multerOptions))
  create(
    @Body() dto: CreatePostDto,
    @GetUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(dto, user.userId, file);
  }

  @Get()
  findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id/comentarios')
  listComments(
    @Param('id') id: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.postsService.listComments(id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Put(':pubId/comentarios/:commentId')
  editComment(
    @Param('pubId') pubId: string,
    @Param('commentId') commentId: string,
    @GetUser() user: AuthUser,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.postsService.editComment(pubId, commentId, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED)
  like(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.postsService.like(id, user);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  unlike(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.postsService.unlike(id, user);
  }

  @Post(':id/comentarios')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id') id: string,
    @GetUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, user, dto);
  }
}
