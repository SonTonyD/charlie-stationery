import { bootstrapApplication } from '@angular/platform-browser';
import { inject, type BeforeSendEvent } from '@vercel/analytics';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    inject({
      beforeSend(event: BeforeSendEvent) {
        const url = new URL(event.url, window.location.origin);
        if (url.pathname === '/checkout/success') {
          url.searchParams.delete('session_id');
          return { ...event, url: url.toString() };
        }
        return event;
      },
    });
  })
  .catch((err) => console.error(err));
