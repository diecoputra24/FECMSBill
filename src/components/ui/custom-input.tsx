import * as React from "react"
import { cn } from "@/lib/utils"

export interface CustomInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ className, type, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="relative group">
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
                            icon && "pl-11",
                            "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100",
                            "cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:bg-primary/10 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:transition-all",
                            error ? "border-red-500 focus-visible:ring-red-100 focus-visible:border-red-500" : "border-slate-200",
                            className
                        )}
                        ref={ref}
                        onClick={(e) => {
                            if (type === "date" && (e.target as any).showPicker) {
                                (e.target as any).showPicker();
                            }
                        }}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                            {icon}
                        </div>
                    )}
                </div>
                {error && <p className="text-[11px] font-medium text-red-500 ml-1">{error}</p>}
            </div>
        )
    }
)
CustomInput.displayName = "CustomInput"

export interface CustomTextAreaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const CustomTextArea = React.forwardRef<HTMLTextAreaElement, CustomTextAreaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <textarea
                    className={cn(
                        "flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm resize-none",
                        error ? "border-red-500 focus-visible:ring-red-100 focus-visible:border-red-500" : "border-slate-200",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="text-[11px] font-medium text-red-500 ml-1">{error}</p>}
            </div>
        )
    }
)
CustomTextArea.displayName = "CustomTextArea"


export interface CustomCurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label?: string;
    error?: string;
    value?: string | number;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

const CustomCurrencyInput = React.forwardRef<HTMLInputElement, CustomCurrencyInputProps>(
    ({ className, label, error, value, onValueChange, ...props }, ref) => {
        // Internal state for display value
        const [displayValue, setDisplayValue] = React.useState("");

        // Sync display value when prop value changes (e.g., initial load or reset)
        React.useEffect(() => {
            if (value === "" || value === undefined || value === null) {
                setDisplayValue("");
            } else {
                const numericVal = typeof value === 'string' ? parseFloat(value) : value;
                if (!isNaN(numericVal)) {
                    setDisplayValue(numericVal.toLocaleString('id-ID'));
                } else {
                    setDisplayValue("");
                }
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Remove non-digit characters
            const rawValue = inputValue.replace(/\D/g, '');

            if (rawValue === "") {
                setDisplayValue("");
                onValueChange("");
                return;
            }

            // Convert to number and format back to string with dots
            const numberValue = parseInt(rawValue, 10);
            const formatted = numberValue.toLocaleString('id-ID');

            setDisplayValue(formatted);
            onValueChange(numberValue.toString());
        };

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <input
                    type="text" // Always text to allow formatting
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
                        "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100",
                        error ? "border-red-500 focus-visible:ring-red-100 focus-visible:border-red-500" : "border-slate-200",
                        className
                    )}
                    ref={ref}
                    value={displayValue}
                    onChange={handleChange}
                    {...props}
                />
                {error && <p className="text-[11px] font-medium text-red-500 ml-1">{error}</p>}
            </div>
        )
    }
)
CustomCurrencyInput.displayName = "CustomCurrencyInput"

export interface CustomSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ checked, onChange, label, disabled }) => {
    return (
        <label className={cn(
            "relative inline-flex items-center cursor-pointer group",
            disabled && "opacity-50 cursor-not-allowed"
        )}>
            <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={cn(
                "w-11 h-6 transition-all duration-300 rounded-full border-2",
                checked
                    ? "bg-primary border-primary"
                    : "bg-slate-200 border-slate-200"
            )}>
                <div className={cn(
                    "absolute top-[4px] left-[4px] bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                    checked ? "translate-x-5" : "translate-x-0"
                )} />
            </div>
            {label && (
                <span className="ml-3 text-sm font-medium text-slate-700 select-none">
                    {label}
                </span>
            )}
        </label>
    );
};

export { CustomInput, CustomTextArea, CustomCurrencyInput, CustomSwitch }
