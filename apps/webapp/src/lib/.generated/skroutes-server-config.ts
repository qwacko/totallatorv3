// Auto-generated server-side config by skroutes-plugin
// WARNING: This file imports from server files and should only be used server-side
import type { StandardSchemaV1 } from 'skroutes';


// Import schema definitions from both client and server files
import { _routeConfig as routeConfig0 } from '../../../src/routes/(loggedIn)/accounts/+page.server';
import { _routeConfig as routeConfig1 } from '../../../src/routes/(loggedIn)/accounts/[id]/delete/+page.server';
import { _routeConfig as routeConfig2 } from '../../../src/routes/(loggedIn)/accounts/bulkEdit/+page.server';
import { _routeConfig as routeConfig3 } from '../../../src/routes/(loggedIn)/accounts/download/+server';
import { _routeConfig as routeConfig4 } from '../../../src/routes/(loggedIn)/admin/cron/+page.server';
import { _routeConfig as routeConfig5 } from '../../../src/routes/(loggedIn)/admin/cron/[id]/+page.server';
import { _routeConfig as routeConfig6 } from '../../../src/routes/(loggedIn)/admin/cron/executions/+page.server';
import { _routeConfig as routeConfig7 } from '../../../src/routes/(loggedIn)/associated/+page.server';
import { _routeConfig as routeConfig8 } from '../../../src/routes/(loggedIn)/autoImport/+page.server';
import { _routeConfig as routeConfig9 } from '../../../src/routes/(loggedIn)/autoImport/[id]/+page.server';
import { _routeConfig as routeConfig10 } from '../../../src/routes/(loggedIn)/autoImport/[id]/[filename]/+server';
import { _routeConfig as routeConfig11 } from '../../../src/routes/(loggedIn)/autoImport/[id]/delete/+page.server';
import { _routeConfig as routeConfig12 } from '../../../src/routes/(loggedIn)/backup/+page.server';
import { _routeConfig as routeConfig13 } from '../../../src/routes/(loggedIn)/backup/[id]/+page.server';
import { _routeConfig as routeConfig14 } from '../../../src/routes/(loggedIn)/backup/download/[filename]/+server';
import { _routeConfig as routeConfig15 } from '../../../src/routes/(loggedIn)/bills/+page.server';
import { _routeConfig as routeConfig16 } from '../../../src/routes/(loggedIn)/bills/[id]/+page.server';
import { _routeConfig as routeConfig17 } from '../../../src/routes/(loggedIn)/bills/[id]/delete/+page.server';
import { _routeConfig as routeConfig18 } from '../../../src/routes/(loggedIn)/bills/download/+server';
import { _routeConfig as routeConfig19 } from '../../../src/routes/(loggedIn)/budgets/+page.server';
import { _routeConfig as routeConfig20 } from '../../../src/routes/(loggedIn)/budgets/[id]/+page.server';
import { _routeConfig as routeConfig21 } from '../../../src/routes/(loggedIn)/budgets/[id]/delete/+page.server';
import { _routeConfig as routeConfig22 } from '../../../src/routes/(loggedIn)/budgets/download/+server';
import { _routeConfig as routeConfig23 } from '../../../src/routes/(loggedIn)/categories/+page.server';
import { _routeConfig as routeConfig24 } from '../../../src/routes/(loggedIn)/categories/[id]/+page.server';
import { _routeConfig as routeConfig25 } from '../../../src/routes/(loggedIn)/categories/[id]/delete/+page.server';
import { _routeConfig as routeConfig26 } from '../../../src/routes/(loggedIn)/categories/download/+server';
import { _routeConfig as routeConfig27 } from '../../../src/routes/(loggedIn)/files/+page.server';
import { _routeConfig as routeConfig28 } from '../../../src/routes/(loggedIn)/files/linkUnlinked/+page.server';
import { _routeConfig as routeConfig29 } from '../../../src/routes/(loggedIn)/filters/+page.server';
import { _routeConfig as routeConfig30 } from '../../../src/routes/(loggedIn)/filters/[id]/+page.server';
import { _routeConfig as routeConfig31 } from '../../../src/routes/(loggedIn)/filters/[id]/apply/+page.server';
import { _routeConfig as routeConfig32 } from '../../../src/routes/(loggedIn)/filters/[id]/delete/+page.server';
import { _routeConfig as routeConfig33 } from '../../../src/routes/(loggedIn)/filters/create/+page.server';
import { _routeConfig as routeConfig34 } from '../../../src/routes/(loggedIn)/import/+page.server';
import { _routeConfig as routeConfig35 } from '../../../src/routes/(loggedIn)/import/[id]/+page.server';
import { _routeConfig as routeConfig36 } from '../../../src/routes/(loggedIn)/import/[id]/delete/+page.server';
import { _routeConfig as routeConfig37 } from '../../../src/routes/(loggedIn)/import/[id]/deleteLinked/+page.server';
import { _routeConfig as routeConfig38 } from '../../../src/routes/(loggedIn)/import/[id]/forget/+page.server';
import { _routeConfig as routeConfig39 } from '../../../src/routes/(loggedIn)/importMapping/+page.server';
import { _routeConfig as routeConfig40 } from '../../../src/routes/(loggedIn)/importMapping/[id]/+page.server';
import { _routeConfig as routeConfig41 } from '../../../src/routes/(loggedIn)/importMapping/[id]/delete/+page.server';
import { _routeConfig as routeConfig42 } from '../../../src/routes/(loggedIn)/journals/+page.server';
import { _routeConfig as routeConfig43 } from '../../../src/routes/(loggedIn)/journals/bulkEdit/+page.server';
import { _routeConfig as routeConfig44 } from '../../../src/routes/(loggedIn)/journals/clone/+page.server';
import { _routeConfig as routeConfig45 } from '../../../src/routes/(loggedIn)/journals/create/+page.server';
import { _routeConfig as routeConfig46 } from '../../../src/routes/(loggedIn)/journals/delete/+page.server';
import { _routeConfig as routeConfig47 } from '../../../src/routes/(loggedIn)/journals/download/+server';
import { _routeConfig as routeConfig48 } from '../../../src/routes/(loggedIn)/journals/summaryData/+server';
import { _routeConfig as routeConfig49 } from '../../../src/routes/(loggedIn)/labels/+page.server';
import { _routeConfig as routeConfig50 } from '../../../src/routes/(loggedIn)/labels/[id]/+page.server';
import { _routeConfig as routeConfig51 } from '../../../src/routes/(loggedIn)/labels/[id]/delete/+page.server';
import { _routeConfig as routeConfig52 } from '../../../src/routes/(loggedIn)/labels/download/+server';
import { _routeConfig as routeConfig53 } from '../../../src/routes/(loggedIn)/llm/logs/+page.server';
import { _routeConfig as routeConfig54 } from '../../../src/routes/(loggedIn)/llm/logs/[id]/+page.server';
import { _routeConfig as routeConfig55 } from '../../../src/routes/(loggedIn)/llm/providers/[id]/+page.server';
import { _routeConfig as routeConfig56 } from '../../../src/routes/(loggedIn)/llm/providers/[id]/delete/+page.server';
import { _routeConfig as routeConfig57 } from '../../../src/routes/(loggedIn)/queries/grouped/+page.server';
import { _routeConfig as routeConfig58 } from '../../../src/routes/(loggedIn)/queries/list/+page.server';
import { _routeConfig as routeConfig59 } from '../../../src/routes/(loggedIn)/reports/[id]/+page.server';
import { _routeConfig as routeConfig60 } from '../../../src/routes/(loggedIn)/reports/[id]/delete/+page.server';
import { _routeConfig as routeConfig61 } from '../../../src/routes/(loggedIn)/tags/+page.server';
import { _routeConfig as routeConfig62 } from '../../../src/routes/(loggedIn)/tags/[id]/+page.server';
import { _routeConfig as routeConfig63 } from '../../../src/routes/(loggedIn)/tags/[id]/delete/+page.server';
import { _routeConfig as routeConfig64 } from '../../../src/routes/(loggedIn)/tags/download/+server';
import { _routeConfig as routeConfig65 } from '../../../src/routes/(loggedIn)/users/+page.server';

export const serverRouteConfig = {
  '/(loggedIn)/accounts': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig0.searchParamsValidation,
        },
  '/(loggedIn)/accounts/[id]/delete': {
          paramsValidation: routeConfig1.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/accounts/bulkEdit': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig2.searchParamsValidation,
        },
  '/(loggedIn)/accounts/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig3.searchParamsValidation,
        },
  '/(loggedIn)/admin/cron': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig4.searchParamsValidation,
        },
  '/(loggedIn)/admin/cron/[id]': {
          paramsValidation: routeConfig5.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/admin/cron/executions': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig6.searchParamsValidation,
        },
  '/(loggedIn)/associated': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig7.searchParamsValidation,
        },
  '/(loggedIn)/autoImport': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig8.searchParamsValidation,
        },
  '/(loggedIn)/autoImport/[id]': {
          paramsValidation: routeConfig9.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/autoImport/[id]/[filename]': {
          paramsValidation: routeConfig10.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/autoImport/[id]/delete': {
          paramsValidation: routeConfig11.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/backup': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig12.searchParamsValidation,
        },
  '/(loggedIn)/backup/[id]': {
          paramsValidation: routeConfig13.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/backup/download/[filename]': {
          paramsValidation: routeConfig14.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/bills': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig15.searchParamsValidation,
        },
  '/(loggedIn)/bills/[id]': {
          paramsValidation: routeConfig16.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/bills/[id]/delete': {
          paramsValidation: routeConfig17.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/bills/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig18.searchParamsValidation,
        },
  '/(loggedIn)/budgets': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig19.searchParamsValidation,
        },
  '/(loggedIn)/budgets/[id]': {
          paramsValidation: routeConfig20.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/budgets/[id]/delete': {
          paramsValidation: routeConfig21.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/budgets/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig22.searchParamsValidation,
        },
  '/(loggedIn)/categories': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig23.searchParamsValidation,
        },
  '/(loggedIn)/categories/[id]': {
          paramsValidation: routeConfig24.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/categories/[id]/delete': {
          paramsValidation: routeConfig25.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/categories/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig26.searchParamsValidation,
        },
  '/(loggedIn)/files': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig27.searchParamsValidation,
        },
  '/(loggedIn)/files/linkUnlinked': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig28.searchParamsValidation,
        },
  '/(loggedIn)/filters': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig29.searchParamsValidation,
        },
  '/(loggedIn)/filters/[id]': {
          paramsValidation: routeConfig30.paramsValidation,
          searchParamsValidation: routeConfig30.searchParamsValidation,
        },
  '/(loggedIn)/filters/[id]/apply': {
          paramsValidation: routeConfig31.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/filters/[id]/delete': {
          paramsValidation: routeConfig32.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/filters/create': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig33.searchParamsValidation,
        },
  '/(loggedIn)/import': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig34.searchParamsValidation,
        },
  '/(loggedIn)/import/[id]': {
          paramsValidation: routeConfig35.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/import/[id]/delete': {
          paramsValidation: routeConfig36.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/import/[id]/deleteLinked': {
          paramsValidation: routeConfig37.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/import/[id]/forget': {
          paramsValidation: routeConfig38.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/importMapping': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig39.searchParamsValidation,
        },
  '/(loggedIn)/importMapping/[id]': {
          paramsValidation: routeConfig40.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/importMapping/[id]/delete': {
          paramsValidation: routeConfig41.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/journals': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig42.searchParamsValidation,
        },
  '/(loggedIn)/journals/bulkEdit': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig43.searchParamsValidation,
        },
  '/(loggedIn)/journals/clone': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig44.searchParamsValidation,
        },
  '/(loggedIn)/journals/create': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig45.searchParamsValidation,
        },
  '/(loggedIn)/journals/delete': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig46.searchParamsValidation,
        },
  '/(loggedIn)/journals/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig47.searchParamsValidation,
        },
  '/(loggedIn)/journals/summaryData': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig48.searchParamsValidation,
        },
  '/(loggedIn)/labels': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig49.searchParamsValidation,
        },
  '/(loggedIn)/labels/[id]': {
          paramsValidation: routeConfig50.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/labels/[id]/delete': {
          paramsValidation: routeConfig51.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/labels/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig52.searchParamsValidation,
        },
  '/(loggedIn)/llm/logs': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig53.searchParamsValidation,
        },
  '/(loggedIn)/llm/logs/[id]': {
          paramsValidation: routeConfig54.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/llm/providers/[id]': {
          paramsValidation: routeConfig55.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/llm/providers/[id]/delete': {
          paramsValidation: routeConfig56.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/queries/grouped': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig57.searchParamsValidation,
        },
  '/(loggedIn)/queries/list': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig58.searchParamsValidation,
        },
  '/(loggedIn)/reports/[id]': {
          paramsValidation: routeConfig59.paramsValidation,
          searchParamsValidation: routeConfig59.searchParamsValidation,
        },
  '/(loggedIn)/reports/[id]/delete': {
          paramsValidation: routeConfig60.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/tags': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig61.searchParamsValidation,
        },
  '/(loggedIn)/tags/[id]': {
          paramsValidation: routeConfig62.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/tags/[id]/delete': {
          paramsValidation: routeConfig63.paramsValidation,
          searchParamsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
        },
  '/(loggedIn)/tags/download': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig64.searchParamsValidation,
        },
  '/(loggedIn)/users': {
          paramsValidation: {
        '~standard': {
          version: 1,
          vendor: 'skroutes',
          validate: (v: any) => ({ value: {} })
        }
      },
          searchParamsValidation: routeConfig65.searchParamsValidation,
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
        }
} as const;

// Export complete route keys for type checking (server has full visibility)
export type ServerRouteKeys = '/(loggedIn)/accounts' | '/(loggedIn)/accounts/[id]/delete' | '/(loggedIn)/accounts/bulkEdit' | '/(loggedIn)/accounts/download' | '/(loggedIn)/admin/cron' | '/(loggedIn)/admin/cron/[id]' | '/(loggedIn)/admin/cron/executions' | '/(loggedIn)/associated' | '/(loggedIn)/autoImport' | '/(loggedIn)/autoImport/[id]' | '/(loggedIn)/autoImport/[id]/[filename]' | '/(loggedIn)/autoImport/[id]/delete' | '/(loggedIn)/backup' | '/(loggedIn)/backup/[id]' | '/(loggedIn)/backup/download/[filename]' | '/(loggedIn)/bills' | '/(loggedIn)/bills/[id]' | '/(loggedIn)/bills/[id]/delete' | '/(loggedIn)/bills/download' | '/(loggedIn)/budgets' | '/(loggedIn)/budgets/[id]' | '/(loggedIn)/budgets/[id]/delete' | '/(loggedIn)/budgets/download' | '/(loggedIn)/categories' | '/(loggedIn)/categories/[id]' | '/(loggedIn)/categories/[id]/delete' | '/(loggedIn)/categories/download' | '/(loggedIn)/files' | '/(loggedIn)/files/linkUnlinked' | '/(loggedIn)/filters' | '/(loggedIn)/filters/[id]' | '/(loggedIn)/filters/[id]/apply' | '/(loggedIn)/filters/[id]/delete' | '/(loggedIn)/filters/create' | '/(loggedIn)/import' | '/(loggedIn)/import/[id]' | '/(loggedIn)/import/[id]/delete' | '/(loggedIn)/import/[id]/deleteLinked' | '/(loggedIn)/import/[id]/forget' | '/(loggedIn)/importMapping' | '/(loggedIn)/importMapping/[id]' | '/(loggedIn)/importMapping/[id]/delete' | '/(loggedIn)/journals' | '/(loggedIn)/journals/bulkEdit' | '/(loggedIn)/journals/clone' | '/(loggedIn)/journals/create' | '/(loggedIn)/journals/delete' | '/(loggedIn)/journals/download' | '/(loggedIn)/journals/summaryData' | '/(loggedIn)/labels' | '/(loggedIn)/labels/[id]' | '/(loggedIn)/labels/[id]/delete' | '/(loggedIn)/labels/download' | '/(loggedIn)/llm/logs' | '/(loggedIn)/llm/logs/[id]' | '/(loggedIn)/llm/providers/[id]' | '/(loggedIn)/llm/providers/[id]/delete' | '/(loggedIn)/queries/grouped' | '/(loggedIn)/queries/list' | '/(loggedIn)/reports/[id]' | '/(loggedIn)/reports/[id]/delete' | '/(loggedIn)/tags' | '/(loggedIn)/tags/[id]' | '/(loggedIn)/tags/[id]/delete' | '/(loggedIn)/tags/download' | '/(loggedIn)/users' | '/(loggedIn)/accounts/create' | '/(loggedIn)/autoImport/create' | '/(loggedIn)/backup/import' | '/(loggedIn)/backup-restore-progress' | '/(loggedIn)/bills/create' | '/(loggedIn)/budgets/create' | '/(loggedIn)/categories/create' | '/(loggedIn)/dev/bulkLoad' | '/(loggedIn)/dropdowns/accounts' | '/(loggedIn)/dropdowns/bills' | '/(loggedIn)/dropdowns/budgets' | '/(loggedIn)/dropdowns/categories' | '/(loggedIn)/dropdowns/importMappings' | '/(loggedIn)/dropdowns/labels' | '/(loggedIn)/dropdowns/tags' | '/(loggedIn)/files/[id]' | '/(loggedIn)/files/[id]/[filename]' | '/(loggedIn)/files/[id]/delete' | '/(loggedIn)/files/[id]/image/[filename]' | '/(loggedIn)/files/create' | '/(loggedIn)/files/linkToTransaction/[id]' | '/(loggedIn)/import/create' | '/(loggedIn)/importMapping/create' | '/(loggedIn)/labels/create' | '/(loggedIn)/llm/providers' | '/(loggedIn)/llm/providers/create' | '/(loggedIn)/logout' | '/(loggedIn)/reports' | '/(loggedIn)/reports/create' | '/(loggedIn)/reports/element/[id]' | '/(loggedIn)/reports/element/[id]/[item]' | '/(loggedIn)/settings' | '/(loggedIn)/tags/create' | '/(loggedIn)/test' | '/(loggedIn)/users/[id]' | '/(loggedIn)/users/[id]/delete' | '/(loggedIn)/users/[id]/password' | '/(loggedIn)/users/create' | '/(loggedOut)/firstUser' | '/(loggedOut)/login' | '/(loggedOut)/signup' | '/' | '/logConfiguration' | '/logs';

// Export complete type mapping for schema inference (server has full visibility)
export type ServerRouteTypeMap = {
  '/(loggedIn)/accounts': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig0.searchParamsValidation> };
  '/(loggedIn)/accounts/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig1.paramsValidation>; searchParams: {} };
  '/(loggedIn)/accounts/bulkEdit': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig2.searchParamsValidation> };
  '/(loggedIn)/accounts/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig3.searchParamsValidation> };
  '/(loggedIn)/admin/cron': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig4.searchParamsValidation> };
  '/(loggedIn)/admin/cron/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig5.paramsValidation>; searchParams: {} };
  '/(loggedIn)/admin/cron/executions': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig6.searchParamsValidation> };
  '/(loggedIn)/associated': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig7.searchParamsValidation> };
  '/(loggedIn)/autoImport': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig8.searchParamsValidation> };
  '/(loggedIn)/autoImport/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig9.paramsValidation>; searchParams: {} };
  '/(loggedIn)/autoImport/[id]/[filename]': { params: StandardSchemaV1.InferOutput<typeof routeConfig10.paramsValidation>; searchParams: {} };
  '/(loggedIn)/autoImport/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig11.paramsValidation>; searchParams: {} };
  '/(loggedIn)/backup': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig12.searchParamsValidation> };
  '/(loggedIn)/backup/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig13.paramsValidation>; searchParams: {} };
  '/(loggedIn)/backup/download/[filename]': { params: StandardSchemaV1.InferOutput<typeof routeConfig14.paramsValidation>; searchParams: {} };
  '/(loggedIn)/bills': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig15.searchParamsValidation> };
  '/(loggedIn)/bills/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig16.paramsValidation>; searchParams: {} };
  '/(loggedIn)/bills/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig17.paramsValidation>; searchParams: {} };
  '/(loggedIn)/bills/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig18.searchParamsValidation> };
  '/(loggedIn)/budgets': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig19.searchParamsValidation> };
  '/(loggedIn)/budgets/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig20.paramsValidation>; searchParams: {} };
  '/(loggedIn)/budgets/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig21.paramsValidation>; searchParams: {} };
  '/(loggedIn)/budgets/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig22.searchParamsValidation> };
  '/(loggedIn)/categories': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig23.searchParamsValidation> };
  '/(loggedIn)/categories/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig24.paramsValidation>; searchParams: {} };
  '/(loggedIn)/categories/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig25.paramsValidation>; searchParams: {} };
  '/(loggedIn)/categories/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig26.searchParamsValidation> };
  '/(loggedIn)/files': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig27.searchParamsValidation> };
  '/(loggedIn)/files/linkUnlinked': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig28.searchParamsValidation> };
  '/(loggedIn)/filters': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig29.searchParamsValidation> };
  '/(loggedIn)/filters/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig30.paramsValidation>; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig30.searchParamsValidation> };
  '/(loggedIn)/filters/[id]/apply': { params: StandardSchemaV1.InferOutput<typeof routeConfig31.paramsValidation>; searchParams: {} };
  '/(loggedIn)/filters/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig32.paramsValidation>; searchParams: {} };
  '/(loggedIn)/filters/create': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig33.searchParamsValidation> };
  '/(loggedIn)/import': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig34.searchParamsValidation> };
  '/(loggedIn)/import/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig35.paramsValidation>; searchParams: {} };
  '/(loggedIn)/import/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig36.paramsValidation>; searchParams: {} };
  '/(loggedIn)/import/[id]/deleteLinked': { params: StandardSchemaV1.InferOutput<typeof routeConfig37.paramsValidation>; searchParams: {} };
  '/(loggedIn)/import/[id]/forget': { params: StandardSchemaV1.InferOutput<typeof routeConfig38.paramsValidation>; searchParams: {} };
  '/(loggedIn)/importMapping': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig39.searchParamsValidation> };
  '/(loggedIn)/importMapping/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig40.paramsValidation>; searchParams: {} };
  '/(loggedIn)/importMapping/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig41.paramsValidation>; searchParams: {} };
  '/(loggedIn)/journals': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig42.searchParamsValidation> };
  '/(loggedIn)/journals/bulkEdit': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig43.searchParamsValidation> };
  '/(loggedIn)/journals/clone': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig44.searchParamsValidation> };
  '/(loggedIn)/journals/create': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig45.searchParamsValidation> };
  '/(loggedIn)/journals/delete': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig46.searchParamsValidation> };
  '/(loggedIn)/journals/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig47.searchParamsValidation> };
  '/(loggedIn)/journals/summaryData': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig48.searchParamsValidation> };
  '/(loggedIn)/labels': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig49.searchParamsValidation> };
  '/(loggedIn)/labels/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig50.paramsValidation>; searchParams: {} };
  '/(loggedIn)/labels/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig51.paramsValidation>; searchParams: {} };
  '/(loggedIn)/labels/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig52.searchParamsValidation> };
  '/(loggedIn)/llm/logs': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig53.searchParamsValidation> };
  '/(loggedIn)/llm/logs/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig54.paramsValidation>; searchParams: {} };
  '/(loggedIn)/llm/providers/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig55.paramsValidation>; searchParams: {} };
  '/(loggedIn)/llm/providers/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig56.paramsValidation>; searchParams: {} };
  '/(loggedIn)/queries/grouped': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig57.searchParamsValidation> };
  '/(loggedIn)/queries/list': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig58.searchParamsValidation> };
  '/(loggedIn)/reports/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig59.paramsValidation>; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig59.searchParamsValidation> };
  '/(loggedIn)/reports/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig60.paramsValidation>; searchParams: {} };
  '/(loggedIn)/tags': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig61.searchParamsValidation> };
  '/(loggedIn)/tags/[id]': { params: StandardSchemaV1.InferOutput<typeof routeConfig62.paramsValidation>; searchParams: {} };
  '/(loggedIn)/tags/[id]/delete': { params: StandardSchemaV1.InferOutput<typeof routeConfig63.paramsValidation>; searchParams: {} };
  '/(loggedIn)/tags/download': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig64.searchParamsValidation> };
  '/(loggedIn)/users': { params: {}; searchParams: StandardSchemaV1.InferOutput<typeof routeConfig65.searchParamsValidation> };
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
  '/(loggedIn)/files/[id]/[filename]': { params: { id: string; filename: string }; searchParams: {} };
  '/(loggedIn)/files/[id]/delete': { params: { id: string }; searchParams: {} };
  '/(loggedIn)/files/[id]/image/[filename]': { params: { id: string; filename: string }; searchParams: {} };
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
  '/(loggedIn)/reports/element/[id]/[item]': { params: { id: string; item: string }; searchParams: {} };
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
  '/logs': { params: {}; searchParams: {} }
};

// Convenience type aliases for accessing route param/search param types
export type ServerRouteParams<T extends ServerRouteKeys> = ServerRouteTypeMap[T]['params'];
export type ServerRouteSearchParams<T extends ServerRouteKeys> = ServerRouteTypeMap[T]['searchParams'];

// Export plugin options for reference
export const pluginOptions = {
  "errorURL": "/"
};
