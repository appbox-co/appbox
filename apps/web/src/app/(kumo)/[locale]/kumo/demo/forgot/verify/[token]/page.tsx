import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DemoResetPassword } from "./demo-reset-password"

/** Sample version of the Kumo reset password page. Dev server only; nothing typed is sent. */
export default async function KumoDemoResetPasswordPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { token } = await params

  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense>
      <DemoResetPassword token={token} />
    </Suspense>
  )
}
