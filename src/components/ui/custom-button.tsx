import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const customButtonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                primary: "bg-primary text-white hover:bg-primary/90 border border-primary/10",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
                outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                danger: "bg-red-500 text-white hover:bg-red-600 border border-red-600/10",
            },
            size: {
                sm: "h-9 px-3 text-xs",
                md: "h-10 px-5",
                lg: "h-11 px-6 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
)

export interface CustomButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof customButtonVariants> {
    asChild?: boolean
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(customButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
CustomButton.displayName = "CustomButton"

export { CustomButton, customButtonVariants }
