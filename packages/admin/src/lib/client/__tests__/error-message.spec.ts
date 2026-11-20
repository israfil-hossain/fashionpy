import { describe, expect, test } from "vitest"

import { buildHttpErrorMessage } from "../error-message"

describe("buildHttpErrorMessage", () => {
  test("replaces HTML gateway pages with a status line", () => {
    const html =
      '<!DOCTYPE html><!--[if lt IE 7]><html class="no-js ie6 oldie" lang="en-US">'
    const msg = buildHttpErrorMessage(404, html)
    expect(msg).toBe("Server returned an HTML error page (HTTP 404)")
    expect(msg).not.toContain("<")
  })

  test("keeps plain-text bodies, truncated", () => {
    expect(buildHttpErrorMessage(500, "boom".repeat(200))).toHaveLength(300)
    expect(buildHttpErrorMessage(500, "boom")).toBe("boom")
  })
})
