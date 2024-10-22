using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Diagnostics;

namespace UniqueWarriorsWeb.Pages
{
    public class ErrorModel : PageModel
    {
        public void OnGet(string message = null)
        {
            if (message != null)
            {
                TempData[XError.clientError] = message;
            }
        }
    }
}
