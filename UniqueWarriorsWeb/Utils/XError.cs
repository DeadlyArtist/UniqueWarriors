using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace UniqueWarriorsWeb.Utils
{
	public static class XError
	{
		public const string serverError = "ServerError";
		public const string clientError = "ClientError";
		public const string serverErrorMessage = "error.";
		public const string invalidFormMessage = "Invalid Form.";
        public const string routeParameterMissing = "A route parameter was missing.";

		public const string errorPage = "/Error";

        public static IActionResult ClientError(this PageModel page, string error)
        {
            page.TempData[clientError] = error;
            return page.RedirectToPage(errorPage);
        }

        public static IActionResult ServerError(this PageModel page, string error)
        {
            page.TempData[serverError] = error;
            return page.RedirectToPage(errorPage);
        }
    }
}
