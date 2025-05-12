export const fileReasonEnum = ['receipt', 'invoice', 'report', 'summary', 'info'] as const;
export type FileReasonType = (typeof fileReasonEnum)[number];

export const fileReasonEnumInfo = {
	receipt: {
		id: 'receipt',
		name: 'Receipt'
	},
	invoice: {
		id: 'invoice',
		name: 'Invoice'
	},
	report: {
		id: 'report',
		name: 'Report'
	},
	summary: {
		id: 'summary',
		name: 'Journal Summary'
	},
	info: {
		id: 'info',
		name: 'Info'
	}
} satisfies {
	[key in FileReasonType]: {
		id: key;
		name: string;
	};
};

export type FileReasonInfoType = typeof fileReasonEnumInfo;

export const fileReasonDropdown = Object.values(fileReasonEnumInfo).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});

export const fileReasonToText = (fileReason: FileReasonType) => {
	return fileReasonEnumInfo[fileReason].name;
};
