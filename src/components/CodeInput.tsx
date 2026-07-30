import React, { useState, useRef, useEffect } from 'react';

interface CodeInputProps {
  length: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Entrada OTP de 6 dígitos, coherente con tema claro/oscuro.
 */
export const CodeInput: React.FC<CodeInputProps> = ({
  length,
  onComplete,
  disabled = false,
  error = false,
}) => {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const emitIfComplete = (next: string[]) => {
    const completeCode = next.join('');
    if (completeCode.length === length && !completedRef.current) {
      completedRef.current = true;
      onComplete(completeCode);
      setTimeout(() => {
        completedRef.current = false;
      }, 1500);
    }
  };

  const handleChange = (value: string, index: number) => {
    if (disabled) return;
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
    emitIfComplete(newCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;
    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    const nextIndex = Math.min(pastedData.length, length - 1);
    setActiveIndex(nextIndex);
    inputRefs.current[nextIndex]?.focus();
    emitIfComplete(newCode);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" role="group" aria-label="Código de verificación">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={code[index]}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setActiveIndex(index)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Dígito ${index + 1}`}
          className={`
            zm-input w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold font-display px-0
            ${error ? 'zm-input-error' : ''}
            ${activeIndex === index && !error ? 'border-amber-500 ring-4 ring-amber-500/15' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  );
};
