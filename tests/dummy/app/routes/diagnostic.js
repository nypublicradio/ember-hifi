import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
export default Route.extend({
  hifi: service(),

  async model(params) {
    if (params.autoplay) {
      this.hifi.play(params.autoplay)
    }
  }

});
