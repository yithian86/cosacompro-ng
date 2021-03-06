import { Component, AfterViewInit, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { Page } from "tns-core-modules/ui/page/page";
import { RouterExtensions } from "nativescript-angular/router/router-extensions";
import { action } from "ui/dialogs";

import { RadSideDrawerComponent } from "nativescript-ui-sidedrawer/angular/side-drawer-directives";
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';

import { GroceryListDetailsDBService } from "~/components/grocery-list-details/services/app-grocery-list.database.service";
import { MyGroceryListsDBService } from "~/components/my-grocery-lists/services/app-my-grocery-lists.database.service";
import { AppComponent } from "~/app.component";

var applicationSettings = require("application-settings");


@Component({
  selector: "app-grocery-list-details",
  templateUrl: "components/grocery-list-details/views/app-grocery-list-details.component.html",
  styleUrls: ["components/grocery-list-details/styles/app-grocery-list-details.component.css"],
  providers: [GroceryListDetailsDBService, MyGroceryListsDBService]
})
export class AppGroceryListDetailsComponent extends AppComponent implements AfterViewInit, OnInit {
  public title: string;
  public isEditing: boolean;
  public myLists: Array<any>;
  public groceryList: Array<any>;
  private activeListIndex: number;
  
  private drawer: RadSideDrawer;

  @ViewChild(RadSideDrawerComponent) public drawerComponent: RadSideDrawerComponent;

  constructor(
    private groceryListDetailsDBService: GroceryListDetailsDBService,
    private myGroceryListsDBService: MyGroceryListsDBService,
    private _changeDetectionRef: ChangeDetectorRef,
    private routerExtensions: RouterExtensions,
    public page: Page
  ) {
    super();
  }

  ngOnInit() {
    // Init variables
    this.title = "My grocery list";
    this.isEditing = false;

    // Load grocery lists and selected grocery list details
    this.retrieveMyLists();
  }

  ngAfterViewInit() {
    this.drawer = this.drawerComponent.sideDrawer;
    this._changeDetectionRef.detectChanges();
  }


  //////////////////////////////////////// GETTERS AND SETTERS ///////////////////////////////////////////
  public getMyListsNames = (): Array<string> => {
    return !!this.myLists ? this.myLists.map((list: any) => list.listName) : [];
  }

  public getCurrentListName = (): string => {
    if (this.myLists && this.myLists.length > 0) {
      const listNames: Array<string> = this.getMyListsNames();
      return listNames[this.activeListIndex];
    } else {
      return "-";
    }
  }


  ///////////////////////////////////////////// SERVICES /////////////////////////////////////////////////
  public retrieveMyLists = (): void => {
    this.myGroceryListsDBService.getMyLists()
      .then((myLists: any) => {
        this.myLists = !!myLists ? myLists : [];

        // Get stored active list id
        const activeListId: number = applicationSettings.getNumber("activeListId");
        this.activeListIndex = activeListId ? this.myLists.map(list => list.listId).indexOf(activeListId): 0;
        applicationSettings.setNumber("activeListId", this.myLists[this.activeListIndex].listId);
        console.log("Updating active list index:", applicationSettings.getNumber("activeListId"));

        this.retrieveGroceryListDetails();
      });
  }

  public retrieveGroceryListDetails = (): void => {
    if (!!this.myLists && this.myLists.length > 0) {
      const listId: number = this.myLists[this.activeListIndex].listId;
      this.groceryListDetailsDBService.getGroceryListDetails(listId)
        .then((groceryList: any) => this.groceryList = !!groceryList ? groceryList : []);
    }
  }

  public updateGroceryList = (productIndex: number): void => {
    const listId: number = this.myLists[this.activeListIndex].listId;
    const glistId: number = this.groceryList[productIndex].id;
    const productId: number = this.groceryList[productIndex].productId;
    const quantity: number = this.groceryList[productIndex].quantity;
    this.displayMessage(`Updating element #${productIndex}: ${listId} ${productId} ${quantity}`);
    this.groceryListDetailsDBService.updateGroceryListDetails(glistId, listId, productId, quantity);
  }

  public deleteGroceryListItem = (productIndex: number): void => {
    const glistId: number = this.groceryList[productIndex].id;
    this.displayMessage(`Deleting element #${productIndex}`);
    // Update DB
    this.groceryListDetailsDBService.deleteGroceryListItem(glistId);

    // Update list
    this.groceryList.splice(productIndex, 1);
  }


  ///////////////////////////////////////////// CHECKERS /////////////////////////////////////////////////
  public isGroceryListEmpty = (): boolean => {
    return !this.groceryList || this.groceryList.length === 0;
  }


  ///////////////////////////////////////// HANDLERS/ACTIONS /////////////////////////////////////////////
  public switchEditMode = (): void => {
    this.isEditing = !this.isEditing;
  }

  public showMyListsDialog = () => {
    const myListsNames: Array<string> = this.getMyListsNames();

    let options = {
      title: "Choose grocery list:",
      message: "",
      cancelButtonText: "Cancel",
      actions: myListsNames
    };

    action(options).then((selectedListName) => {
      if (selectedListName && selectedListName !== "Cancel" && myListsNames && myListsNames.length > 0) {
        // Update current list index
        this.activeListIndex = myListsNames.indexOf(selectedListName);

        // Update stored active list id
        applicationSettings.setNumber("activeListId", this.myLists[this.activeListIndex].listId);
        console.log(applicationSettings.getNumber("activeListId"));

        this.retrieveGroceryListDetails();
      }
    });
  }

  public openDrawer = (): void => {
    this.drawer.showDrawer();
  }

  public closeDrawer = (): void => {
    this.drawer.closeDrawer();
  }

  public navigateTo = (path: string, param?: string): void => {
    console.log(`Navigating to ${path}   ${param}`);
    const activeListId: number = this.myLists[this.activeListIndex].listId;
    const navigateParams: Array<any> = param ? [path, param, activeListId] : [path];
    this.routerExtensions.navigate(navigateParams, {
      transition: {
        name: "slideLeft",
        duration: 300
      }
    });
  }
}
