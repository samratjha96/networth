import * as React from "react";
import {
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";

// Define type for FormFieldContextValue
export type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

// Create and export the FormFieldContext
export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

// Define type for FormItemContextValue
export type FormItemContextValue = {
  id: string;
};

// Create and export the FormItemContext
export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

// Export the useFormField hook
export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}; 