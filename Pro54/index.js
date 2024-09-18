import { WebAudioModule } from './sdk/index.js';
import * as patch from "./cmaj_Pro54.js";
import { createPatchViewHolder } from "./cmaj_api/cmaj-patch-view.js"

export default class SimpleGainPlugin extends WebAudioModule
{
  async createAudioNode (options)
  {
    this.patchConnection = await patch.createAudioWorkletNodePatchConnection (this.audioContext, "cmaj-processor");

    this.patchConnection.audioNode.getParameterInfo = function()
    {
      return {};
    };

    return this.patchConnection.audioNode;
  }

  createGui()
  {
    return createPatchViewHolder (this.patchConnection);
  }
}