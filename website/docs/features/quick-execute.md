---
sidebar_position: 8
---

# Quick Execute

One-click execution for Map/Reduce and Scheduled scripts directly from the script record page.

## How It Works

When viewing a Map/Reduce or Scheduled script record in NetSuite, an **Execute** button is automatically added to the page toolbar next to the Back button.

1. Navigate to any Map/Reduce or Scheduled script record
2. Click the **Execute** button
3. The script is triggered immediately using the first available deployment

The button shows "Executing..." while the script is being triggered, then returns to "Execute" when complete.

## Supported Script Types

The Execute button only appears for script types that can be manually executed:

| Script Type | Supported |
|-------------|-----------|
| Map/Reduce | Yes |
| Scheduled | Yes |
| User Event | No |
| Client | No |
| Suitelet | No |
| RESTlet | No |

## Theme Support

The Quick Execute feature works with both NetSuite themes:

- **Redwood Theme** (newer) - Uses the native button styling
- **Legacy Theme** - Uses the classic NetSuite button styling

## No Deployment Available

If the script doesn't have an available deployment (one that is active and has remaining usage), you'll see an alert:

> "No available deployment found for this script. Please create a deployment first."

To fix this:
1. Go to the Deployments subtab on the script record
2. Create a new deployment or ensure an existing one is:
   - Status: Released
   - Not scheduled (or scheduled for a future time that hasn't passed)
   - Has remaining usage available

## How It Works Internally

The Execute button works by:
1. Loading the script record in edit mode via a hidden iframe
2. Triggering NetSuite's native "Save and Execute" action
3. The script execution is queued just as if you had clicked the button manually

This approach ensures proper permission checking and uses NetSuite's built-in execution mechanism.

## Limitations

- Only works when viewing an existing script record (not when creating a new one)
- Requires at least one active deployment for the script
- The execution is queued - there's no real-time status feedback in the button itself
- You must have permission to execute the script
