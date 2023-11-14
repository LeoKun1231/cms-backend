/*
 * @Author: Leo l024983409@qq.com
 * @Date: 2023-11-12 20:59:52
 * @LastEditors: Leo l024983409@qq.com
 * @LastEditTime: 2023-11-14 21:49:47
 * @FilePath: \cms\src\modules\goods-info\goods-info.service.ts
 * @Description:
 */
import { GoodsInfo } from "@/shared/entities/goods-info.entity";
import { AppLoggerSevice } from "@/shared/logger/logger.service";
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Between, Like, QueryFailedError, Repository } from "typeorm";
import { v4 as UUID } from "uuid";
import { CreateGoodsInfoDto } from "./dto/create-goods-info.dto";
import { ExportGoodsInfoList } from "./dto/export-goods-info-list.dto";
import { ExportGoodsInfoDto } from "./dto/export-goods-info.dto";
import { QueryGoodsInfoDto } from "./dto/query-goods-info.dto";
import { UpdateGoodsInfoDto } from "./dto/update-goods-info.dto";

@Injectable()
export class GoodsInfoService {
	constructor(
		private readonly logger: AppLoggerSevice,
		@InjectRepository(GoodsInfo)
		private readonly goodsInfoRepository: Repository<GoodsInfo>,
	) {
		this.logger.setContext(GoodsInfoService.name);
	}

	/**
	 * 创建商品
	 * @param createGoodsInfoDto
	 * @returns
	 */
	async create(createGoodsInfoDto: CreateGoodsInfoDto) {
		this.logger.log(`${this.create.name} was called`);
		try {
			const { status, ...rest } = createGoodsInfoDto;
			const goodsInfo = this.goodsInfoRepository.create({
				...rest,
				enable: !!status,
			});
			await this.goodsInfoRepository.save(goodsInfo);
			return "创建商品成功~";
		} catch (error) {
			this.logger.error(error);
			if (
				error instanceof QueryFailedError &&
				error.driverError.errno === 1062
			) {
				throw new BadRequestException("商品名已存在");
			}
			throw new BadRequestException("创建商品失败");
		}
	}

	/**
	 * 更新商品信息
	 * @param id 商品ID
	 * @param updateGoodsInfoDto 更新商品信息
	 * @returns
	 */
	async update(id: number, updateGoodsInfoDto: UpdateGoodsInfoDto) {
		this.logger.log(`${this.update.name} was called`);
		this.judgeCanDo(id);
		try {
			await this.findOne(id);
			const { status } = updateGoodsInfoDto;
			let enable = undefined;
			if (status !== undefined) {
				enable = !!status;
			}
			const goodsInfo = this.goodsInfoRepository.create({
				...updateGoodsInfoDto,
				enable,
			});
			await this.goodsInfoRepository.update({ id, isDelete: false }, goodsInfo);
			return "更新商品信息成功~";
		} catch (error) {
			this.logger.error(error);
			if (
				error instanceof QueryFailedError &&
				error.driverError.errno === 1062
			) {
				throw new BadRequestException("商品名已存在");
			}
			if (error.message) {
				throw new BadRequestException(error.message);
			}
			throw new BadRequestException("更新商品信息失败");
		}
	}

	/**
	 * 获取商品列表
	 * @param queryGoodsInfoDto
	 * @returns
	 */
	async findAll(queryGoodsInfoDto: QueryGoodsInfoDto) {
		this.logger.log(`${this.findAll.name} was called`);

		try {
			const {
				createAt,
				id,
				offset,
				size,
				updateAt,
				address,
				desc,
				favorCount,
				inventoryCount,
				name,
				newPrice,
				oldPrice,
				saleCount,
				status,
			} = queryGoodsInfoDto;

			const [list, totalCount] = await this.goodsInfoRepository.findAndCount({
				where: {
					id,
					name: name && Like(`%${name}%`),
					oldPrice: oldPrice && Between(oldPrice[0], oldPrice[1]),
					newPrice: newPrice && Between(newPrice[0], newPrice[1]),
					desc: desc && Like(`%${desc}%`),
					address: address && Like(`%${address}%`),
					inventoryCount:
						inventoryCount && Between(inventoryCount[0], inventoryCount[1]),
					saleCount: saleCount && Between(saleCount[0], saleCount[1]),
					favorCount: favorCount && Between(favorCount[0], favorCount[1]),
					enable: status && !!status,
					createAt: createAt && Between(createAt[0], createAt[1]),
					updateAt: updateAt && Between(updateAt[0], updateAt[1]),
					isDelete: false,
				},
				take: size,
				skip: offset,
			});
			return plainToInstance(
				ExportGoodsInfoList,
				{
					list,
					totalCount,
				},
				{
					excludeExtraneousValues: true,
				},
			);
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品列表失败");
		}
	}

	/**
	 * 获取商品详情
	 * @param id 商品ID
	 * @returns
	 */
	async findOne(id: number) {
		this.logger.log(`${this.findOne.name} was called`);
		try {
			const goodsInfo = await this.goodsInfoRepository.findOne({
				where: {
					id,
					isDelete: false,
				},
			});
			if (!goodsInfo) {
				throw new BadRequestException("商品不存在");
			}
			return plainToInstance(ExportGoodsInfoDto, goodsInfo, {
				excludeExtraneousValues: true,
			});
		} catch (error) {
			this.logger.error(error);
			if (error.message) {
				throw new BadRequestException(error.message);
			}
			throw new BadRequestException("获取商品信息失败");
		}
	}

	/**
	 * 删除商品
	 * @param id 商品ID
	 * @returns
	 */
	async remove(id: number) {
		this.logger.log(`${this.remove.name} was called`);
		this.judgeCanDo(id);
		try {
			const { name } = await this.findOne(id);
			await this.goodsInfoRepository.update(
				{ id, isDelete: false },
				{ isDelete: true, name: `已删除_${name}_${UUID()}` },
			);
			return "删除商品成功~";
		} catch (error) {
			this.logger.log(error);
			if (error.message) {
				throw new BadRequestException(error.message);
			}
			throw new BadRequestException("删除商品失败");
		}
	}

	/**
	 * 获取商品分类数量
	 * @returns
	 */
	async getCategoryCount() {
		this.logger.log(`${this.getCategoryCount.name} was called`);
		try {
			return await this.goodsInfoRepository
				.createQueryBuilder("goodsInfo")
				.leftJoinAndSelect("goodsInfo.category", "category")
				.select("category.id", "id")
				.addSelect("category.name", "name")
				.addSelect("count(*)", "goodsCount")
				.where("goodsInfo.isDelete = false")
				.where("category.isDelete = false")
				.groupBy("id")
				.having("goodsCount > 0")
				.getRawMany();
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品分类数量失败");
		}
	}

	/**
	 * 获取商品分类销量
	 * @returns
	 */
	async getCategorySale() {
		this.logger.log(`${this.getCategorySale.name} was called`);
		try {
			return await this.goodsInfoRepository
				.createQueryBuilder("goodsInfo")
				.leftJoinAndSelect("goodsInfo.category", "category")
				.select("category.id", "id")
				.addSelect("category.name", "name")
				.addSelect("sum(goodsInfo.saleCount)", "goodsCount")
				.where("goodsInfo.isDelete = false")
				.where("category.isDelete = false")
				.groupBy("id")
				.having("sum(goodsInfo.saleCount) > 0")
				.getRawMany();
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品分类销量失败");
		}
	}

	/**
	 * 获取商品分类收藏数
	 * @returns
	 */
	async getCategoryFavor() {
		this.logger.log(`${this.getCategoryFavor.name} was called`);
		try {
			return await this.goodsInfoRepository
				.createQueryBuilder("goodsInfo")
				.leftJoinAndSelect("goodsInfo.category", "category")
				.select("category.id", "id")
				.addSelect("category.name", "name")
				.addSelect("sum(goodsInfo.favorCount)", "goodsFavor")
				.where("goodsInfo.isDelete = false")
				.where("category.isDelete = false")
				.groupBy("id")
				.having("sum(goodsInfo.favorCount) > 0")
				.getRawMany();
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品分类收藏数失败");
		}
	}

	/**
	 * 获取商品销量top10
	 * @returns
	 */
	async getSaleTop10() {
		this.logger.log(`${this.getSaleTop10.name} was called`);
		try {
			return await this.goodsInfoRepository.find({
				select: {
					id: true,
					name: true,
					saleCount: true,
				},
				where: {
					isDelete: false,
				},
				order: {
					saleCount: "DESC",
				},
				take: 10,
			});
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品销量top10失败");
		}
	}

	/**
	 * 获取发货地销量
	 * @returns
	 */
	async getAddressSale() {
		this.logger.log(`${this.getAddressSale.name} was called`);
		try {
			return await this.goodsInfoRepository
				.createQueryBuilder("goodsInfo")
				.select("goodsInfo.address", "address")
				.addSelect("sum(goodsInfo.saleCount)", "count")
				.where("goodsInfo.isDelete = false")
				.groupBy("address")
				.having("count > 0")
				.getRawMany();
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品发货地销量失败");
		}
	}

	/**
	 * 获取商品统计数量
	 * @returns
	 */
	async getAmountCounts(): Promise<{ sale; favor; inventory; saleroom }> {
		this.logger.log(`${this.getAmountCounts.name} was called`);
		try {
			return await this.goodsInfoRepository
				.createQueryBuilder("goodsInfo")
				.select("sum(goodsInfo.saleCount)", "sale")
				.addSelect("sum(goodsInfo.favorCount)", "favor")
				.addSelect("sum(goodsInfo.inventoryCount)", "inventory")
				.addSelect("sum(goodsInfo.saleCount * goodsInfo.newPrice)", "saleroom")
				.where("goodsInfo.isDelete = false")
				.getRawOne();
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException("获取商品统计信息失败");
		}
	}

	judgeCanDo(id: number) {
		if (id <= 183) {
			throw new ForbiddenException("系统商品不可操作");
		}
	}
}
