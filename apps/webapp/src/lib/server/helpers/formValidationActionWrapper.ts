import { type ActionFailure, type RequestEvent } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type SuperValidated,
} from "sveltekit-superforms";
import {
  type Infer,
  type InferIn,
  zod4,
  type ZodValidationSchema,
} from "sveltekit-superforms/adapters";

import type { DBType } from "@totallator/database";

import type { RouteId } from "$app/types";

type ValidatedForm<T extends ZodValidationSchema> = SuperValidated<
  Infer<T, "zod4">,
  any,
  InferIn<T, "zod4">
>;

type FormValidationWrapperParams<
  T extends ZodValidationSchema,
  RequireUser extends boolean,
> = {
  title: string;
  validation: T;
  action: (data: {
    data: Infer<T>;
    userId: RequireUser extends true ? string : string | undefined;
    db: DBType;
    form: ValidatedForm<T>;
  }) => Promise<
    | { form: ValidatedForm<T> }
    | ActionFailure<{ form: ValidatedForm<T> }>
    | void
  >;
  requireUser?: RequireUser;
};

export const formValidationActionWrapper = <
  T extends ZodValidationSchema,
  RequireUser extends boolean,
>(
  params: FormValidationWrapperParams<T, RequireUser>,
): ((
  data: RequestEvent<Partial<Record<string, string>>, RouteId>,
) => Promise<
  { form: ValidatedForm<T> } | ActionFailure<{ form: ValidatedForm<T> }>
>) => {
  const { title, validation, action, requireUser = true } = params;

  const sanitiseFormData = (form: ValidatedForm<T>) => {
    // Remove any non-POJO items (e.g., files) from the form data
    const sanitizedData = JSON.parse(JSON.stringify(form.data));
    form.data = sanitizedData;
  };

  return async (
    data: RequestEvent<Partial<Record<string, string>>, RouteId>,
  ) => {
    const form = await superValidate(data, zod4(validation));
    const creationPerson = data.locals.user?.id;

    if (!creationPerson && requireUser) {
      data.locals.global.logger.error(`${title} : User not found`);
      throw new Error(`${title} : User not found`);
    }

    if (!form.valid) {
      data.locals.global.logger.error(
        `${title} : Form Validation Error`,
        form.errors,
      );
      sanitiseFormData(form);
      return { form };
    }

    try {
      const result = await action({
        data: form.data,
        userId: creationPerson as string, // Type Fixed as this makes the types work correctly.
        db: data.locals.db,
        form,
      });

      if (!result) {
        sanitiseFormData(form);
        return { form };
      } else {
        if ("form" in result) {
          sanitiseFormData(result.form);
        } else {
          sanitiseFormData(result.data.form);
        }
        return result;
      }
    } catch (e) {
      data.locals.global.logger.error(`${title} : Error`, e);
      sanitiseFormData(form);
      return message(form, `${title} : Error`);
    }
  };
};
