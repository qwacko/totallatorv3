import { fileFileHandler } from '@/server/files/fileHandler';
import { getContextDB } from '@totallator/context';
import { fileTable } from '@totallator/database';
import { CreateFileSchemaCoreType, FileTypeType } from '@totallator/shared';
import { nanoid } from 'nanoid';
import { updatedTime } from '../misc/updatedTime';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import sharp from 'sharp';

export const addFileToAssociatedInfo = async ({
	data,
	associatedId
}: {
	data: CreateFileSchemaCoreType;
	associatedId: string;
}): Promise<void> => {
	const db = getContextDB();
	const fileId = nanoid();

	const { file: fileData, reason, title, ...restData } = data;

	const originalFilename = fileData.name;
	const filename = `${fileId}-${originalFilename}`;
	const thumbnailFilename = `${fileId}-thumbnail-${originalFilename}`;
	const size = fileData.size;

	const fileIsPDF = fileData.type === 'application/pdf';
	const fileIsJPG = fileData.type === 'image/jpeg';
	const fileIsPNG = fileData.type === 'image/png';
	const fileIsWEBP = fileData.type === 'image/webp';
	const fileIsGIF = fileData.type === 'image/gif';
	const fileIsTIFF = fileData.type === 'image/tiff';
	const fileIsAVIF = fileData.type === 'image/avif';
	const fileIsSVG = fileData.type === 'image/svg+xml';
	const fileIsImage =
		fileIsJPG || fileIsPNG || fileIsWEBP || fileIsGIF || fileIsTIFF || fileIsAVIF || fileIsSVG;
	const type: FileTypeType = fileIsPDF
		? 'pdf'
		: fileIsJPG
			? 'jpg'
			: fileIsPNG
				? 'png'
				: fileIsWEBP
					? 'webp'
					: fileIsGIF
						? 'gif'
						: fileIsTIFF
							? 'tiff'
							: fileIsAVIF
								? 'avif'
								: fileIsSVG
									? 'svg'
									: 'other';

	const fileContents = Buffer.from(await fileData.arrayBuffer());

	const thumbnail = fileIsImage ? await sharp(fileContents).resize(400).toBuffer() : undefined;

	await fileFileHandler().write(filename, fileContents);
	if (thumbnail) {
		await fileFileHandler().write(thumbnailFilename, thumbnail);
	}

	const titleUse = title || originalFilename;

	type InsertFile = typeof fileTable.$inferInsert;
	const createData: InsertFile = {
		...restData,
		id: fileId,
		associatedInfoId: associatedId,
		originalFilename,
		filename,
		thumbnailFilename: fileIsImage ? thumbnailFilename : null,
		title: titleUse,
		size,
		type,
		fileExists: true,
		reason,
		...updatedTime()
	};

	await dbExecuteLogger(db.insert(fileTable).values(createData), 'File - Create');
};
