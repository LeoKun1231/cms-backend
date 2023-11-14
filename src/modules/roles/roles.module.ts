/*
 * @Author: Leo l024983409@qq.com
 * @Date: 2023-11-11 22:22:28
 * @LastEditors: Leo l024983409@qq.com
 * @LastEditTime: 2023-11-14 18:34:22
 * @FilePath: \cms\src\modules\roles\roles.module.ts
 * @Description:
 */
import { Role } from "@/shared/entities/role.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MenusModule } from "../menus/menus.module";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
	imports: [TypeOrmModule.forFeature([Role]), MenusModule],
	controllers: [RolesController],
	providers: [RolesService],
	exports: [RolesService],
})
export class RolesModule {}
