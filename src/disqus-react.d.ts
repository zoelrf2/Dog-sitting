declare module 'disqus-react' {
  import * as React from 'react';

  export interface DiscussionEmbedProps {
    shortname: string;
    config: {
      url?: string;
      identifier?: string;
      title?: string;
      language?: string;
      [key: string]: any;
    };
  }

  export class DiscussionEmbed extends React.Component<DiscussionEmbedProps> {}
}
