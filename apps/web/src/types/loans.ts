export interface CreateLoanDto {
    amount: number;
    duration: number;
    guarantorEmail: string; // <--- ADDED
}

export interface Loan {
    id: string;
    amount: string | number;
    principal: string | number;
    interest: string | number;
    totalDue: string | number;
    balance: string | number;
    status: string; // Keeping string to handle various ENUM states loosely on frontend
    guarantors?: Guarantor[];
    // ... other fields
}

export interface Guarantor {
    id: string;
    guarantorEmail: string;
    amountLocked: number;
    status: string;
    loan: {
        user: {
            profile: {
                firstName: string;
                lastName: string;
            }
        }
    }
}