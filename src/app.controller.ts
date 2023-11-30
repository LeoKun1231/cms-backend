/*
 * @Author: Leo l024983409@qq.com
 * @Date: 2023-10-15 12:37:59
 * @LastEditors: Leo l024983409@qq.com
 * @LastEditTime: 2023-10-17 10:14:47
 * @FilePath: \cms\src\app.controller.ts
 * @Description:
 */
import { Controller, Get } from "@nestjs/common";
import { Body, Post } from "@nestjs/common/decorators";
import { AppService } from "./app.service";
import { Public } from "./shared/decorators/public.decorator";
import { PrismaService } from "./shared/prisma";

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly prismaService: PrismaService,
	) {}

	@Get("aa")
	@Public()
	getHello() {
		return this.prismaService.role.create({
			data: {
				name: "112211",
				intro: "111",
			},
		});
	}

	@Post("bb")
	getHello2(@Body() user: any) {
		return user;
	}
}
