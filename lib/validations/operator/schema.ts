import { z } from "zod";

// Commission is fixed at 10% in backend - no need for frontend validation
export const operatorSchema = z.object({
  operatorName: z.string().min(3, "Operator name is required"),
  contactPerson: z.string().min(3, "Contact person is required"),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
});

export type OperatorFormData = z.infer<typeof operatorSchema>;
