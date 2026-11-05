"use client"
import {
  FieldError,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"
import { Button } from '@/components/atoms/Button/Button';
import { zodResolver } from "@hookform/resolvers/zod"
import { LabeledInput } from '@/components/cells/LabeledInput/LabeledInput';
import { registerFormSchema, RegisterFormData } from "./schema"
import { loginWithGoogle, signup } from "@/lib/data/customer"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Container } from "@medusajs/ui"
import Link from "next/link"
import { PasswordValidator } from "@/components/cells/PasswordValidator/PasswordValidator"
import { toast } from "@/lib/helpers/toast"
import { GoogleIcon } from "@/icons"

export const RegisterForm = () => {
  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
    },
  })

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  )
}

const Form = () => {
  const [passwordError, setPasswordError] = useState({
    isValid: false,
    lower: false,
    upper: false,
    "8chars": false,
    symbolOrDigit: false,
  })
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const router = useRouter()

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<RegisterFormData>()

  const submit = async (data: RegisterFormData) => {
    if (!passwordError.isValid) {
      return
    }

    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("first_name", data.firstName)
    formData.append("last_name", data.lastName)
    formData.append("phone", data.phone)

    const res = await signup(formData)

    if (res && !res?.id) {
      // Temporary solution. Check also for status code when it's fixed by backend
      const errorMessage = res.toLowerCase().includes('error: identity with email already exists') ? 'It seems the email you entered is already associated with another account. Please log in instead.' : res
      toast.error({ title: errorMessage})
      return
    }

    toast.success({ title: 'Your account has been created.' })
    router.push('/user')
  }

  const submitGoogle = async () => {
    setIsGoogleSubmitting(true)
    try {
      const res = await loginWithGoogle()

      if (res.success && 'location' in res && res.location) {
        window.location.href = res.location
        return
      }

      toast.error({ title: !res.success ? res.message : 'An error occurred. Please try again.' })
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <main className="container" data-testid="register-page">
      <Container className="border max-w-xl mx-auto mt-8 p-4" data-testid="register-form-container">
        <h1 className="heading-md text-primary uppercase mb-8">
          Create account
        </h1>
        <form onSubmit={handleSubmit(submit)} data-testid="register-form">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              label="First name"
              placeholder="Your first name"
              error={errors.firstName as FieldError}
              data-testid="register-first-name-input"
              {...register("firstName")}
            />
            <LabeledInput
              className="md:w-1/2"
              label="Last name"
              placeholder="Your last name"
              error={errors.lastName as FieldError}
              data-testid="register-last-name-input"
              {...register("lastName")}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              label="E-mail"
              placeholder="Your e-mail address"
              error={errors.email as FieldError}
              data-testid="register-email-input"
              {...register("email")}
            />
            <LabeledInput
              className="md:w-1/2"
              label="Phone"
              placeholder="Your phone number"
              error={errors.phone as FieldError}
              data-testid="register-phone-input"
              {...register("phone")}
            />
          </div>
          <div>
            <LabeledInput
              className="mb-4"
              label="Password"
              placeholder="Your password"
              type="password"
              error={errors.password as FieldError}
              data-testid="register-password-input"
              {...register("password")}
            />
            <PasswordValidator
              password={watch("password")}
              setError={setPasswordError}
            />
          </div>

          <Button
            className="w-full flex justify-center mt-8 uppercase"
            disabled={isSubmitting}
            loading={isSubmitting}
            data-testid="register-submit-button"
          >
            Create account
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-secondary" />
          <span className="label-md uppercase text-secondary">or</span>
          <div className="h-px flex-1 bg-secondary" />
        </div>

        <Button
          variant="tonal"
          className="mt-4 w-full uppercase"
          disabled={isGoogleSubmitting}
          onClick={submitGoogle}
          data-testid="register-google-button"
        >
          <span className="flex items-center justify-center gap-2">
            <GoogleIcon size={18} />
            Continue with Google
          </span>
        </Button>
      </Container>
      <Container className="border max-w-xl mx-auto mt-8 p-4">
        <h2 className="heading-md text-primary uppercase mb-8">
          Already have an account?
        </h2>
        <Link href="/login" data-testid="register-login-link">
          <Button
            variant="tonal"
            className="w-full flex justify-center mt-8 uppercase"
          >
            Log in
          </Button>
        </Link>
      </Container>
    </main>
  )
}
