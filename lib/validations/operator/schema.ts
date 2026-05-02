import { z } from "zod";

export const operatorSchema = z.object({
  operatorName: z.string().min(3, "Operator name is required"),
  contactPerson: z.string().min(3, "Contact person is required"),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  commission: z
    .number({ required_error: "Commission required" })
    .min(0)
    .max(100),
});

export type OperatorFormData = z.infer<typeof operatorSchema>;