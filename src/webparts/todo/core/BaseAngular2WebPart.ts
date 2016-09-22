/**
 * @Copyright (c) Microsoft Corporation.  All rights reserved.
 *
 * Angular2 web part base class
 */

import "reflect-metadata";
require('zone.js');

import {
  BaseClientSideWebPart
} from '@microsoft/sp-client-preview';

import { NgModule, ApplicationRef, Inject, ReflectiveInjector, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

/**
 * All Angular2 client side web parts should inherit from this class.
 */
export default class BaseAngular2WebPart<TProperties>
  extends BaseClientSideWebPart<TProperties> {

  /**
   * Reference to the root application.
   */
  private _app: any;

  /**
   * Reference to the root component.
   */
  private _component: any;

  /**
   * The root Angular2 component for this web part.
   */
  protected get rootComponent(): any {
    return this._component;
  }

  /**
   * Array of class references for the NgModule declarations.
   */
  protected get appDeclarationTypes(): any {
    throw new Error("This API needs to be overridden in the web part class");
  }

  /**
   * Class reference of the root component.
   */
  protected get rootComponentType(): any {
    throw new Error("This API needs to be overridden in the web part class");
  }

  /**
   * Apply the changes to the component.
   */
  protected updateChanges(): void {
    throw new Error('Need to to override this method');
  }

  /**
   * On property change.
   */
  public onPropertyChange(propertyPath: string, newValue: any): void {
    // Trigger app/root-component refresh - zone.js does not pick up chagnes to class properties
    // this._app.changeDetectorRef.detectChanges();
    this._app.tick();
  }

  /**
   * Render the web part. This causes the Angular2 app to be bootstrapped which
   * in turn bootsraps the Angular2 web part root component.
   */
  public render(): void {
    // @todo: most likely we need to make this width:100%
    this.domElement.innerHTML = `<ng2-webpart-${this.context.instanceId} />`;
    this._bootStrapModule();
  }

  /**
   * Bootstrap the root component of the web part.
   */
  private _bootStrapModule(): void {
    platformBrowserDynamic().bootstrapModule(this._getModule()).then(
      ngModuleRef => {

        this._component = this._app['_rootComponents'][0]['_hostElement']['component'];
        this.updateChanges();

        // @question2: Is this the prescribed way to refresh the app.
        this._app.tick();
      }, err => {
        console.log(err);
      }
    );
  }

  /**
   * Get the NgModule reference that will act as the root of this web part.
   */
  private _getModule(): any {
    const component: any = this.rootComponentType.getComponent(this.context.instanceId);
    const declarations = this.appDeclarationTypes.concat(component);
    const webPart = this;
    const AppModule = (function () {
      function AppModule(applicationRef) {
        webPart._app = applicationRef;
      }
      const AppModule1 = Reflect.decorate([
        NgModule({
          imports: [BrowserModule],
          declarations: declarations,
          bootstrap: [component]
        }),
        Reflect.metadata('design:paramtypes', [ApplicationRef])
      ], AppModule);
      return AppModule1;
    } ());
    return AppModule;
  }
}