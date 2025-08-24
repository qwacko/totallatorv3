// Auto-generated client-side config by skroutes-plugin
// This file only imports from client-side files and can be safely used in the browser
import type { StandardSchemaV1 } from 'skroutes';
import type { RouteConfig } from 'skroutes';

// Import schema definitions from client-side page files only

// Type-only imports from server files for better type inference
import type { _routeConfig as serverRouteConfig1000 } from '../../../src/routes/(loggedIn)/accounts/+page.server';
import type { _routeConfig as serverRouteConfig1001 } from '../../../src/routes/(loggedIn)/accounts/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1002 } from '../../../src/routes/(loggedIn)/accounts/bulkEdit/+page.server';
import type { _routeConfig as serverRouteConfig1003 } from '../../../src/routes/(loggedIn)/accounts/download/+server';
import type { _routeConfig as serverRouteConfig1004 } from '../../../src/routes/(loggedIn)/admin/cron/+page.server';
import type { _routeConfig as serverRouteConfig1005 } from '../../../src/routes/(loggedIn)/admin/cron/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1006 } from '../../../src/routes/(loggedIn)/admin/cron/executions/+page.server';
import type { _routeConfig as serverRouteConfig1007 } from '../../../src/routes/(loggedIn)/associated/+page.server';
import type { _routeConfig as serverRouteConfig1008 } from '../../../src/routes/(loggedIn)/autoImport/+page.server';
import type { _routeConfig as serverRouteConfig1009 } from '../../../src/routes/(loggedIn)/autoImport/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1010 } from '../../../src/routes/(loggedIn)/autoImport/[id]/[filename]/+server';
import type { _routeConfig as serverRouteConfig1011 } from '../../../src/routes/(loggedIn)/autoImport/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1012 } from '../../../src/routes/(loggedIn)/backup/+page.server';
import type { _routeConfig as serverRouteConfig1013 } from '../../../src/routes/(loggedIn)/backup/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1014 } from '../../../src/routes/(loggedIn)/backup/download/[filename]/+server';
import type { _routeConfig as serverRouteConfig1015 } from '../../../src/routes/(loggedIn)/bills/+page.server';
import type { _routeConfig as serverRouteConfig1016 } from '../../../src/routes/(loggedIn)/bills/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1017 } from '../../../src/routes/(loggedIn)/bills/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1018 } from '../../../src/routes/(loggedIn)/bills/download/+server';
import type { _routeConfig as serverRouteConfig1019 } from '../../../src/routes/(loggedIn)/budgets/+page.server';
import type { _routeConfig as serverRouteConfig1020 } from '../../../src/routes/(loggedIn)/budgets/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1021 } from '../../../src/routes/(loggedIn)/budgets/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1022 } from '../../../src/routes/(loggedIn)/budgets/download/+server';
import type { _routeConfig as serverRouteConfig1023 } from '../../../src/routes/(loggedIn)/categories/+page.server';
import type { _routeConfig as serverRouteConfig1024 } from '../../../src/routes/(loggedIn)/categories/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1025 } from '../../../src/routes/(loggedIn)/categories/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1026 } from '../../../src/routes/(loggedIn)/categories/download/+server';
import type { _routeConfig as serverRouteConfig1027 } from '../../../src/routes/(loggedIn)/files/+page.server';
import type { _routeConfig as serverRouteConfig1028 } from '../../../src/routes/(loggedIn)/files/linkUnlinked/+page.server';
import type { _routeConfig as serverRouteConfig1029 } from '../../../src/routes/(loggedIn)/filters/+page.server';
import type { _routeConfig as serverRouteConfig1030 } from '../../../src/routes/(loggedIn)/filters/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1031 } from '../../../src/routes/(loggedIn)/filters/[id]/apply/+page.server';
import type { _routeConfig as serverRouteConfig1032 } from '../../../src/routes/(loggedIn)/filters/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1033 } from '../../../src/routes/(loggedIn)/filters/create/+page.server';
import type { _routeConfig as serverRouteConfig1034 } from '../../../src/routes/(loggedIn)/import/+page.server';
import type { _routeConfig as serverRouteConfig1035 } from '../../../src/routes/(loggedIn)/import/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1036 } from '../../../src/routes/(loggedIn)/import/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1037 } from '../../../src/routes/(loggedIn)/import/[id]/deleteLinked/+page.server';
import type { _routeConfig as serverRouteConfig1038 } from '../../../src/routes/(loggedIn)/import/[id]/forget/+page.server';
import type { _routeConfig as serverRouteConfig1039 } from '../../../src/routes/(loggedIn)/importMapping/+page.server';
import type { _routeConfig as serverRouteConfig1040 } from '../../../src/routes/(loggedIn)/importMapping/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1041 } from '../../../src/routes/(loggedIn)/importMapping/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1042 } from '../../../src/routes/(loggedIn)/journals/+page.server';
import type { _routeConfig as serverRouteConfig1043 } from '../../../src/routes/(loggedIn)/journals/bulkEdit/+page.server';
import type { _routeConfig as serverRouteConfig1044 } from '../../../src/routes/(loggedIn)/journals/clone/+page.server';
import type { _routeConfig as serverRouteConfig1045 } from '../../../src/routes/(loggedIn)/journals/create/+page.server';
import type { _routeConfig as serverRouteConfig1046 } from '../../../src/routes/(loggedIn)/journals/delete/+page.server';
import type { _routeConfig as serverRouteConfig1047 } from '../../../src/routes/(loggedIn)/journals/download/+server';
import type { _routeConfig as serverRouteConfig1048 } from '../../../src/routes/(loggedIn)/journals/summaryData/+server';
import type { _routeConfig as serverRouteConfig1049 } from '../../../src/routes/(loggedIn)/labels/+page.server';
import type { _routeConfig as serverRouteConfig1050 } from '../../../src/routes/(loggedIn)/labels/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1051 } from '../../../src/routes/(loggedIn)/labels/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1052 } from '../../../src/routes/(loggedIn)/labels/download/+server';
import type { _routeConfig as serverRouteConfig1053 } from '../../../src/routes/(loggedIn)/llm/logs/+page.server';
import type { _routeConfig as serverRouteConfig1054 } from '../../../src/routes/(loggedIn)/llm/logs/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1055 } from '../../../src/routes/(loggedIn)/llm/providers/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1056 } from '../../../src/routes/(loggedIn)/llm/providers/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1057 } from '../../../src/routes/(loggedIn)/queries/grouped/+page.server';
import type { _routeConfig as serverRouteConfig1058 } from '../../../src/routes/(loggedIn)/queries/list/+page.server';
import type { _routeConfig as serverRouteConfig1059 } from '../../../src/routes/(loggedIn)/reports/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1060 } from '../../../src/routes/(loggedIn)/reports/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1061 } from '../../../src/routes/(loggedIn)/tags/+page.server';
import type { _routeConfig as serverRouteConfig1062 } from '../../../src/routes/(loggedIn)/tags/[id]/+page.server';
import type { _routeConfig as serverRouteConfig1063 } from '../../../src/routes/(loggedIn)/tags/[id]/delete/+page.server';
import type { _routeConfig as serverRouteConfig1064 } from '../../../src/routes/(loggedIn)/tags/download/+server';
import type { _routeConfig as serverRouteConfig1065 } from '../../../src/routes/(loggedIn)/users/+page.server';

// Export validation type mapping for each route
export type RouteValidationTypeMap = {
	'/(loggedIn)/accounts': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1000.searchParamsValidation;
	};
	'/(loggedIn)/accounts/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1001.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/accounts/bulkEdit': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1002.searchParamsValidation;
	};
	'/(loggedIn)/accounts/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1003.searchParamsValidation;
	};
	'/(loggedIn)/admin/cron': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1004.searchParamsValidation;
	};
	'/(loggedIn)/admin/cron/[id]': {
		paramsValidation: typeof serverRouteConfig1005.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/admin/cron/executions': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1006.searchParamsValidation;
	};
	'/(loggedIn)/associated': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1007.searchParamsValidation;
	};
	'/(loggedIn)/autoImport': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1008.searchParamsValidation;
	};
	'/(loggedIn)/autoImport/[id]': {
		paramsValidation: typeof serverRouteConfig1009.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/autoImport/[id]/[filename]': {
		paramsValidation: typeof serverRouteConfig1010.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/autoImport/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1011.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/backup': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1012.searchParamsValidation;
	};
	'/(loggedIn)/backup/[id]': {
		paramsValidation: typeof serverRouteConfig1013.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/backup/download/[filename]': {
		paramsValidation: typeof serverRouteConfig1014.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/bills': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1015.searchParamsValidation;
	};
	'/(loggedIn)/bills/[id]': {
		paramsValidation: typeof serverRouteConfig1016.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/bills/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1017.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/bills/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1018.searchParamsValidation;
	};
	'/(loggedIn)/budgets': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1019.searchParamsValidation;
	};
	'/(loggedIn)/budgets/[id]': {
		paramsValidation: typeof serverRouteConfig1020.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/budgets/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1021.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/budgets/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1022.searchParamsValidation;
	};
	'/(loggedIn)/categories': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1023.searchParamsValidation;
	};
	'/(loggedIn)/categories/[id]': {
		paramsValidation: typeof serverRouteConfig1024.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/categories/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1025.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/categories/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1026.searchParamsValidation;
	};
	'/(loggedIn)/files': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1027.searchParamsValidation;
	};
	'/(loggedIn)/files/linkUnlinked': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1028.searchParamsValidation;
	};
	'/(loggedIn)/filters': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1029.searchParamsValidation;
	};
	'/(loggedIn)/filters/[id]': {
		paramsValidation: typeof serverRouteConfig1030.paramsValidation;
		searchParamsValidation: typeof serverRouteConfig1030.searchParamsValidation;
	};
	'/(loggedIn)/filters/[id]/apply': {
		paramsValidation: typeof serverRouteConfig1031.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/filters/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1032.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/filters/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1033.searchParamsValidation;
	};
	'/(loggedIn)/import': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1034.searchParamsValidation;
	};
	'/(loggedIn)/import/[id]': {
		paramsValidation: typeof serverRouteConfig1035.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/import/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1036.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/import/[id]/deleteLinked': {
		paramsValidation: typeof serverRouteConfig1037.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/import/[id]/forget': {
		paramsValidation: typeof serverRouteConfig1038.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/importMapping': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1039.searchParamsValidation;
	};
	'/(loggedIn)/importMapping/[id]': {
		paramsValidation: typeof serverRouteConfig1040.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/importMapping/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1041.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/journals': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1042.searchParamsValidation;
	};
	'/(loggedIn)/journals/bulkEdit': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1043.searchParamsValidation;
	};
	'/(loggedIn)/journals/clone': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1044.searchParamsValidation;
	};
	'/(loggedIn)/journals/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1045.searchParamsValidation;
	};
	'/(loggedIn)/journals/delete': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1046.searchParamsValidation;
	};
	'/(loggedIn)/journals/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1047.searchParamsValidation;
	};
	'/(loggedIn)/journals/summaryData': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1048.searchParamsValidation;
	};
	'/(loggedIn)/labels': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1049.searchParamsValidation;
	};
	'/(loggedIn)/labels/[id]': {
		paramsValidation: typeof serverRouteConfig1050.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/labels/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1051.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/labels/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1052.searchParamsValidation;
	};
	'/(loggedIn)/llm/logs': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1053.searchParamsValidation;
	};
	'/(loggedIn)/llm/logs/[id]': {
		paramsValidation: typeof serverRouteConfig1054.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/llm/providers/[id]': {
		paramsValidation: typeof serverRouteConfig1055.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/llm/providers/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1056.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/queries/grouped': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1057.searchParamsValidation;
	};
	'/(loggedIn)/queries/list': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1058.searchParamsValidation;
	};
	'/(loggedIn)/reports/[id]': {
		paramsValidation: typeof serverRouteConfig1059.paramsValidation;
		searchParamsValidation: typeof serverRouteConfig1059.searchParamsValidation;
	};
	'/(loggedIn)/reports/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1060.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/tags': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1061.searchParamsValidation;
	};
	'/(loggedIn)/tags/[id]': {
		paramsValidation: typeof serverRouteConfig1062.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/tags/[id]/delete': {
		paramsValidation: typeof serverRouteConfig1063.paramsValidation;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/tags/download': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1064.searchParamsValidation;
	};
	'/(loggedIn)/users': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: typeof serverRouteConfig1065.searchParamsValidation;
	};
	'/(loggedIn)/accounts/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/autoImport/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/backup/import': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/backup-restore-progress': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/bills/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/budgets/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/categories/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dev/bulkLoad': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/accounts': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/bills': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/budgets': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/categories': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/importMappings': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/labels': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/dropdowns/tags': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/[id]': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/[id]/[filename]': {
		paramsValidation: StandardSchemaV1<any, { id: string; filename: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/[id]/delete': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/[id]/image/[filename]': {
		paramsValidation: StandardSchemaV1<any, { id: string; filename: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/files/linkToTransaction/[id]': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/import/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/importMapping/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/labels/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/llm/providers': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/llm/providers/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/logout': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/reports': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/reports/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/reports/element/[id]': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/reports/element/[id]/[item]': {
		paramsValidation: StandardSchemaV1<any, { id: string; item: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/settings': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/tags/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/test': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/users/[id]': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/users/[id]/delete': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/users/[id]/password': {
		paramsValidation: StandardSchemaV1<any, { id: string }>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedIn)/users/create': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedOut)/firstUser': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedOut)/login': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/(loggedOut)/signup': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/logConfiguration': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
	'/logs': {
		paramsValidation: StandardSchemaV1<any, {}>;
		searchParamsValidation: StandardSchemaV1<any, {}>;
	};
};

export const clientRouteConfig = {
	'/(loggedIn)/accounts': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/accounts/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/accounts/bulkEdit': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/accounts/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/accounts/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/admin/cron': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/admin/cron/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/admin/cron/executions': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/associated': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/autoImport': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/autoImport/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/autoImport/[id]/[filename]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');
					result.filename = String(v.filename || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/autoImport/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/autoImport/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/backup': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/backup/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/backup/download/[filename]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.filename = String(v.filename || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/backup/import': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/backup-restore-progress': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/bills': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/bills/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/bills/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/bills/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/bills/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/budgets': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/budgets/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/budgets/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/budgets/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/budgets/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/categories': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/categories/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/categories/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/categories/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/categories/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/dev/bulkLoad': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/accounts': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/bills': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/budgets': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/categories': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/importMappings': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/labels': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/dropdowns/tags': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/files/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/[id]/[filename]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');
					result.filename = String(v.filename || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/[id]/image/[filename]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');
					result.filename = String(v.filename || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/linkToTransaction/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/files/linkUnlinked': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/filters': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/filters/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/filters/[id]/apply': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/filters/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/filters/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/import': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/import/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/import/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/import/[id]/deleteLinked': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/import/[id]/forget': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/import/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/importMapping': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/importMapping/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/importMapping/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/importMapping/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/journals': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/bulkEdit': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/clone': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/journals/summaryData': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/labels': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/labels/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/labels/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/labels/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/labels/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/llm/logs': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/llm/logs/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/llm/providers': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/llm/providers/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/llm/providers/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/llm/providers/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/logout': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/queries/grouped': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/queries/list': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/reports': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/reports/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/reports/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/reports/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/reports/element/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/reports/element/[id]/[item]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');
					result.item = String(v.item || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/settings': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/tags': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/tags/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/tags/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/tags/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/tags/download': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/test': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/users': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: v || {} })
			}
		}
	},
	'/(loggedIn)/users/[id]': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/users/[id]/delete': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/users/[id]/password': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => {
					if (!v || typeof v !== 'object') return { value: {} };
					const result: Record<string, string | undefined> = {};
					result.id = String(v.id || '');

					return { value: result };
				}
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedIn)/users/create': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedOut)/firstUser': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedOut)/login': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/(loggedOut)/signup': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/logConfiguration': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	},
	'/logs': {
		paramsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		},
		searchParamsValidation: {
			'~standard': {
				version: 1,
				vendor: 'skroutes',
				validate: (v: any) => ({ value: {} })
			}
		}
	}
} satisfies RouteConfig as unknown as RouteValidationTypeMap;

// Export route keys for type checking
export type RouteKeys =
	| '/(loggedIn)/accounts'
	| '/(loggedIn)/accounts/[id]/delete'
	| '/(loggedIn)/accounts/bulkEdit'
	| '/(loggedIn)/accounts/create'
	| '/(loggedIn)/accounts/download'
	| '/(loggedIn)/admin/cron'
	| '/(loggedIn)/admin/cron/[id]'
	| '/(loggedIn)/admin/cron/executions'
	| '/(loggedIn)/associated'
	| '/(loggedIn)/autoImport'
	| '/(loggedIn)/autoImport/[id]'
	| '/(loggedIn)/autoImport/[id]/[filename]'
	| '/(loggedIn)/autoImport/[id]/delete'
	| '/(loggedIn)/autoImport/create'
	| '/(loggedIn)/backup'
	| '/(loggedIn)/backup/[id]'
	| '/(loggedIn)/backup/download/[filename]'
	| '/(loggedIn)/backup/import'
	| '/(loggedIn)/backup-restore-progress'
	| '/(loggedIn)/bills'
	| '/(loggedIn)/bills/[id]'
	| '/(loggedIn)/bills/[id]/delete'
	| '/(loggedIn)/bills/create'
	| '/(loggedIn)/bills/download'
	| '/(loggedIn)/budgets'
	| '/(loggedIn)/budgets/[id]'
	| '/(loggedIn)/budgets/[id]/delete'
	| '/(loggedIn)/budgets/create'
	| '/(loggedIn)/budgets/download'
	| '/(loggedIn)/categories'
	| '/(loggedIn)/categories/[id]'
	| '/(loggedIn)/categories/[id]/delete'
	| '/(loggedIn)/categories/create'
	| '/(loggedIn)/categories/download'
	| '/(loggedIn)/dev/bulkLoad'
	| '/(loggedIn)/dropdowns/accounts'
	| '/(loggedIn)/dropdowns/bills'
	| '/(loggedIn)/dropdowns/budgets'
	| '/(loggedIn)/dropdowns/categories'
	| '/(loggedIn)/dropdowns/importMappings'
	| '/(loggedIn)/dropdowns/labels'
	| '/(loggedIn)/dropdowns/tags'
	| '/(loggedIn)/files'
	| '/(loggedIn)/files/[id]'
	| '/(loggedIn)/files/[id]/[filename]'
	| '/(loggedIn)/files/[id]/delete'
	| '/(loggedIn)/files/[id]/image/[filename]'
	| '/(loggedIn)/files/create'
	| '/(loggedIn)/files/linkToTransaction/[id]'
	| '/(loggedIn)/files/linkUnlinked'
	| '/(loggedIn)/filters'
	| '/(loggedIn)/filters/[id]'
	| '/(loggedIn)/filters/[id]/apply'
	| '/(loggedIn)/filters/[id]/delete'
	| '/(loggedIn)/filters/create'
	| '/(loggedIn)/import'
	| '/(loggedIn)/import/[id]'
	| '/(loggedIn)/import/[id]/delete'
	| '/(loggedIn)/import/[id]/deleteLinked'
	| '/(loggedIn)/import/[id]/forget'
	| '/(loggedIn)/import/create'
	| '/(loggedIn)/importMapping'
	| '/(loggedIn)/importMapping/[id]'
	| '/(loggedIn)/importMapping/[id]/delete'
	| '/(loggedIn)/importMapping/create'
	| '/(loggedIn)/journals'
	| '/(loggedIn)/journals/bulkEdit'
	| '/(loggedIn)/journals/clone'
	| '/(loggedIn)/journals/create'
	| '/(loggedIn)/journals/delete'
	| '/(loggedIn)/journals/download'
	| '/(loggedIn)/journals/summaryData'
	| '/(loggedIn)/labels'
	| '/(loggedIn)/labels/[id]'
	| '/(loggedIn)/labels/[id]/delete'
	| '/(loggedIn)/labels/create'
	| '/(loggedIn)/labels/download'
	| '/(loggedIn)/llm/logs'
	| '/(loggedIn)/llm/logs/[id]'
	| '/(loggedIn)/llm/providers'
	| '/(loggedIn)/llm/providers/[id]'
	| '/(loggedIn)/llm/providers/[id]/delete'
	| '/(loggedIn)/llm/providers/create'
	| '/(loggedIn)/logout'
	| '/(loggedIn)/queries/grouped'
	| '/(loggedIn)/queries/list'
	| '/(loggedIn)/reports'
	| '/(loggedIn)/reports/[id]'
	| '/(loggedIn)/reports/[id]/delete'
	| '/(loggedIn)/reports/create'
	| '/(loggedIn)/reports/element/[id]'
	| '/(loggedIn)/reports/element/[id]/[item]'
	| '/(loggedIn)/settings'
	| '/(loggedIn)/tags'
	| '/(loggedIn)/tags/[id]'
	| '/(loggedIn)/tags/[id]/delete'
	| '/(loggedIn)/tags/create'
	| '/(loggedIn)/tags/download'
	| '/(loggedIn)/test'
	| '/(loggedIn)/users'
	| '/(loggedIn)/users/[id]'
	| '/(loggedIn)/users/[id]/delete'
	| '/(loggedIn)/users/[id]/password'
	| '/(loggedIn)/users/create'
	| '/(loggedOut)/firstUser'
	| '/(loggedOut)/login'
	| '/(loggedOut)/signup'
	| '/'
	| '/logConfiguration'
	| '/logs';

// Export type mapping for schema inference
export type RouteTypeMap = {
	'/(loggedIn)/accounts': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1000.searchParamsValidation>;
	};
	'/(loggedIn)/accounts/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1001.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/accounts/bulkEdit': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1002.searchParamsValidation>;
	};
	'/(loggedIn)/accounts/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1003.searchParamsValidation>;
	};
	'/(loggedIn)/admin/cron': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1004.searchParamsValidation>;
	};
	'/(loggedIn)/admin/cron/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1005.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/admin/cron/executions': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1006.searchParamsValidation>;
	};
	'/(loggedIn)/associated': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1007.searchParamsValidation>;
	};
	'/(loggedIn)/autoImport': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1008.searchParamsValidation>;
	};
	'/(loggedIn)/autoImport/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1009.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/autoImport/[id]/[filename]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1010.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/autoImport/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1011.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/backup': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1012.searchParamsValidation>;
	};
	'/(loggedIn)/backup/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1013.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/backup/download/[filename]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1014.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/bills': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1015.searchParamsValidation>;
	};
	'/(loggedIn)/bills/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1016.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/bills/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1017.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/bills/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1018.searchParamsValidation>;
	};
	'/(loggedIn)/budgets': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1019.searchParamsValidation>;
	};
	'/(loggedIn)/budgets/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1020.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/budgets/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1021.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/budgets/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1022.searchParamsValidation>;
	};
	'/(loggedIn)/categories': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1023.searchParamsValidation>;
	};
	'/(loggedIn)/categories/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1024.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/categories/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1025.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/categories/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1026.searchParamsValidation>;
	};
	'/(loggedIn)/files': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1027.searchParamsValidation>;
	};
	'/(loggedIn)/files/linkUnlinked': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1028.searchParamsValidation>;
	};
	'/(loggedIn)/filters': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1029.searchParamsValidation>;
	};
	'/(loggedIn)/filters/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1030.paramsValidation>;
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1030.searchParamsValidation>;
	};
	'/(loggedIn)/filters/[id]/apply': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1031.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/filters/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1032.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/filters/create': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1033.searchParamsValidation>;
	};
	'/(loggedIn)/import': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1034.searchParamsValidation>;
	};
	'/(loggedIn)/import/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1035.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/import/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1036.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/import/[id]/deleteLinked': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1037.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/import/[id]/forget': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1038.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/importMapping': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1039.searchParamsValidation>;
	};
	'/(loggedIn)/importMapping/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1040.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/importMapping/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1041.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/journals': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1042.searchParamsValidation>;
	};
	'/(loggedIn)/journals/bulkEdit': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1043.searchParamsValidation>;
	};
	'/(loggedIn)/journals/clone': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1044.searchParamsValidation>;
	};
	'/(loggedIn)/journals/create': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1045.searchParamsValidation>;
	};
	'/(loggedIn)/journals/delete': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1046.searchParamsValidation>;
	};
	'/(loggedIn)/journals/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1047.searchParamsValidation>;
	};
	'/(loggedIn)/journals/summaryData': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1048.searchParamsValidation>;
	};
	'/(loggedIn)/labels': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1049.searchParamsValidation>;
	};
	'/(loggedIn)/labels/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1050.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/labels/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1051.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/labels/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1052.searchParamsValidation>;
	};
	'/(loggedIn)/llm/logs': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1053.searchParamsValidation>;
	};
	'/(loggedIn)/llm/logs/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1054.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/llm/providers/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1055.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/llm/providers/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1056.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/queries/grouped': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1057.searchParamsValidation>;
	};
	'/(loggedIn)/queries/list': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1058.searchParamsValidation>;
	};
	'/(loggedIn)/reports/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1059.paramsValidation>;
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1059.searchParamsValidation>;
	};
	'/(loggedIn)/reports/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1060.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/tags': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1061.searchParamsValidation>;
	};
	'/(loggedIn)/tags/[id]': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1062.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/tags/[id]/delete': {
		params: StandardSchemaV1.InferOutput<typeof serverRouteConfig1063.paramsValidation>;
		searchParams: {};
	};
	'/(loggedIn)/tags/download': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1064.searchParamsValidation>;
	};
	'/(loggedIn)/users': {
		params: {};
		searchParams: StandardSchemaV1.InferOutput<typeof serverRouteConfig1065.searchParamsValidation>;
	};
	'/(loggedIn)/accounts/create': { params: {}; searchParams: {} };
	'/(loggedIn)/autoImport/create': { params: {}; searchParams: {} };
	'/(loggedIn)/backup/import': { params: {}; searchParams: {} };
	'/(loggedIn)/backup-restore-progress': { params: {}; searchParams: {} };
	'/(loggedIn)/bills/create': { params: {}; searchParams: {} };
	'/(loggedIn)/budgets/create': { params: {}; searchParams: {} };
	'/(loggedIn)/categories/create': { params: {}; searchParams: {} };
	'/(loggedIn)/dev/bulkLoad': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/accounts': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/bills': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/budgets': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/categories': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/importMappings': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/labels': { params: {}; searchParams: {} };
	'/(loggedIn)/dropdowns/tags': { params: {}; searchParams: {} };
	'/(loggedIn)/files/[id]': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/files/[id]/[filename]': {
		params: { id: string; filename: string };
		searchParams: {};
	};
	'/(loggedIn)/files/[id]/delete': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/files/[id]/image/[filename]': {
		params: { id: string; filename: string };
		searchParams: {};
	};
	'/(loggedIn)/files/create': { params: {}; searchParams: {} };
	'/(loggedIn)/files/linkToTransaction/[id]': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/import/create': { params: {}; searchParams: {} };
	'/(loggedIn)/importMapping/create': { params: {}; searchParams: {} };
	'/(loggedIn)/labels/create': { params: {}; searchParams: {} };
	'/(loggedIn)/llm/providers': { params: {}; searchParams: {} };
	'/(loggedIn)/llm/providers/create': { params: {}; searchParams: {} };
	'/(loggedIn)/logout': { params: {}; searchParams: {} };
	'/(loggedIn)/reports': { params: {}; searchParams: {} };
	'/(loggedIn)/reports/create': { params: {}; searchParams: {} };
	'/(loggedIn)/reports/element/[id]': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/reports/element/[id]/[item]': {
		params: { id: string; item: string };
		searchParams: {};
	};
	'/(loggedIn)/settings': { params: {}; searchParams: {} };
	'/(loggedIn)/tags/create': { params: {}; searchParams: {} };
	'/(loggedIn)/test': { params: {}; searchParams: {} };
	'/(loggedIn)/users/[id]': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/users/[id]/delete': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/users/[id]/password': { params: { id: string }; searchParams: {} };
	'/(loggedIn)/users/create': { params: {}; searchParams: {} };
	'/(loggedOut)/firstUser': { params: {}; searchParams: {} };
	'/(loggedOut)/login': { params: {}; searchParams: {} };
	'/(loggedOut)/signup': { params: {}; searchParams: {} };
	'/': { params: {}; searchParams: {} };
	'/logConfiguration': { params: {}; searchParams: {} };
	'/logs': { params: {}; searchParams: {} };
};

// Convenience type aliases for accessing route param/search param types
export type RouteParams<T extends RouteKeys> = RouteTypeMap[T]['params'];
export type RouteSearchParams<T extends RouteKeys> = RouteTypeMap[T]['searchParams'];

// Export plugin options for reference
export const pluginOptions = {
	errorURL: '/'
};
